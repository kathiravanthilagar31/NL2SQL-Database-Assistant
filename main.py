# main.py

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from src.helper import create_db_engine, load_schema, generate_ai_response, execute_query
from src.prompt import title_generation_prompt_template
import pandas as pd
from typing import Optional, List, Dict
import uvicorn

load_dotenv()
app = FastAPI(title="NL to SQL Assistant API")
app.mount("/static", StaticFiles(directory="static"), name="static")

db_engine = create_db_engine()
db_schema = load_schema('data', 'ddl_health.txt', 'documentation_health.txt')
llm = ChatOpenAI(model="gpt-4-turbo", temperature=0)

class HistoryItem(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    question: str
    history: Optional[List[HistoryItem]] = None

class QueryResponse(BaseModel):
    summary: str
    sql_query: str = ""
    results_json: str = ""
    error: str = None
    is_clarification: bool = False
    is_refusal: bool = False
    is_greeting: bool = False

class TitleRequest(BaseModel):
    history: List[HistoryItem]

class TitleResponse(BaseModel):
    title: str

@app.post("/generate-title", response_model=TitleResponse)
async def generate_title(request: TitleRequest):
    """Generates a title for a conversation."""
    # We'll use the first 4 messages to get a good context
    conversation_text = "\n".join([f"{h.role}: {h.content}" for h in request.history[:4]])
    
    title_prompt = title_generation_prompt_template.format(conversation_text=conversation_text)
    
    try:
        response = llm.invoke(title_prompt)
        title = response.content.strip().replace('"', '') # Clean up title
        return TitleResponse(title=title)
    except Exception as e:
        print(f"Error generating title: {e}")
        return TitleResponse(title="New Chat")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    with open("static/index.html") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    if not db_engine or not db_schema:
        return QueryResponse(summary="Database connection not configured.", error="DB connection error.")

    response_dict = generate_ai_response(db_schema, request.question, llm, request.history)
    
    if not response_dict:
        return QueryResponse(summary="Could not get a response from the AI.", error="AI response error.")

    response_type = response_dict.get("response_type")
    content = response_dict.get("content", "")

    if response_type == "GREETING":
        return QueryResponse(summary=content, is_greeting=True)
    
    if response_type == "REFUSE":
        return QueryResponse(summary=content, is_refusal=True)
        
    if response_type == "CLARIFY":
        return QueryResponse(summary=content, is_clarification=True)

    if response_type == "SQL":
        sql_query = content
        results_df = execute_query(sql_query, db_engine)

        if results_df is None:
            return QueryResponse(summary="Query execution failed.", sql_query=sql_query, error="Query failed.")
        
        results_json = results_df.to_json(orient='records')


        try:
            results_preview = results_df.to_string()
            
            summary_prompt = f"""
            You are a database assistant providing a summary for a user.
            Your task is to create a brief, natural language summary based on the user's question and the data returned from the database.
            DO NOT apologize, mention that you are an AI, or say you don't have access to data. You are being provided the data directly.
            Focus ONLY on the information present in the data.

            User's Question: "{request.question}"
            
            Data Returned from Query:
            {results_preview}

            Your Summary:
            """
            summary = llm.invoke(summary_prompt).content
        except Exception:
            summary = "Here are the results from your query."

        return QueryResponse(summary=summary, sql_query=sql_query, results_json=results_json)

    return QueryResponse(summary="An unexpected response type was received from the AI.", error="Invalid AI response type.")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)