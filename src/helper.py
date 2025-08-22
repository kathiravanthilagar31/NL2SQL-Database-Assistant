# src/helper.py

import os
import pandas as pd
import json
from sqlalchemy import create_engine, text
from langchain_openai import ChatOpenAI
from typing import Optional, List, Dict
from src.prompt import sql_prompt_template

def create_db_engine():
    """Creates and returns a SQLAlchemy engine for the PostgreSQL database."""
    try:
        conn_str = (f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@"
                    f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}")
        return create_engine(conn_str)
    except Exception as e:
        print(f"Failed to create database engine: {e}")
        return None

def load_schema(schema_dir: str, ddl_filename: str, doc_filename: str) -> Optional[str]:
    """Loads and combines schema files into a single string."""
    try:
        ddl_path = os.path.join(schema_dir, ddl_filename)
        doc_path = os.path.join(schema_dir, doc_filename)
        with open(ddl_path, 'r') as f: ddl = f.read()
        with open(doc_path, 'r') as f: doc = f.read()
        return f"### DDL:\n{ddl}\n\n### Documentation:\n{doc}"
    except Exception as e:
        print(f"Error loading schema files: {e}")
        return None

def generate_ai_response(schema: str, question: str, llm: ChatOpenAI, history: List[Dict[str, str]] = None) -> Optional[dict]:
    """Generates a structured JSON response from the AI."""
    
    # The history items are objects, so we must use dot notation (h.role)
    formatted_history = "\n".join([f"{h.role}: {h.content}" for h in history or []])
    
    full_prompt = sql_prompt_template.format(
        history=formatted_history,
        schema=schema,
        question=question
    )

    try:
        response_str = llm.invoke(full_prompt).content
        clean_json_str = response_str[response_str.find('{'):response_str.rfind('}')+1]
        return json.loads(clean_json_str)
    except (json.JSONDecodeError, AttributeError) as e:
        print(f"Error parsing JSON response from AI: {e}")
        return {
            "response_type": "ERROR",
            "content": "There was an issue interpreting the AI's response."
        }
    except Exception as e:
        print(f"Error generating response: {e}")
        return None

def execute_query(query: str, engine: create_engine) -> Optional[pd.DataFrame]:
    """Executes the SQL query and returns results as a pandas DataFrame."""
    try:
        with engine.connect() as conn:
            return pd.read_sql_query(text(query), conn)
    except Exception as e:
        print(f"Error executing query: {e}")
        return None