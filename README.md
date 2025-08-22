# Natural Language to SQL Assistant 🔍

An intelligent API service that converts natural language questions into SQL queries for healthcare data analysis using LangChain, GPT-4, and FastAPI.

## ✨ Features

* **Natural Language Understanding**: 
    * Converts English questions into optimized PostgreSQL queries
    * Maintains conversation history for context
    * Generates human-readable summaries of query results
* **Healthcare Data Analysis**: 
    * Specialized for oncology database querying
    * Handles complex medical data relationships
    * Supports various medical entities (patients, treatments, diagnoses)
* **AI-Powered Responses**:
    * Automatic query generation using GPT-4
    * Smart response handling (greetings, clarifications, refusals)
    * Dynamic conversation title generation

## 🛠️ Tech Stack

* **Core Framework**: FastAPI
* **AI/ML Stack**: 
    * LangChain for AI orchestration
    * OpenAI GPT-4 for query generation
    * Pydantic for data validation
* **Data Stack**:
    * PostgreSQL for database
    * SQLAlchemy for database interaction
    * Pandas for data handling
* **Other Tools**:
    * Python-dotenv for configuration
    * Uvicorn for ASGI server

## 🚀 Getting Started

### 1. Prerequisites

* Python 3.9+
* PostgreSQL database
* OpenAI API key

### 2. Installation

```bash
git clone <your-repository-url>
cd <your-repository-name>
pip install -r requirements.txt
```

### 3. Environment Setup

Create a `.env` file in the project root:

```env
OPENAI_API_KEY="your_openai_api_key"
DB_USERNAME="your_db_username"
DB_PASSWORD="your_db_password"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="your_db_name"
```

### 4. Project Structure

```plaintext
NL to SQL/
├── src/
│   ├── __init__.py
│   ├── helper.py      # Database and AI utility functions
│   └── prompt.py      # LangChain prompt templates
├── data/
│   ├── ddl_health.txt          # Database schema
│   └── documentation_health.txt # Schema documentation
├── main.py           # FastAPI application
├── requirements.txt  # Project dependencies
└── README.md
```

### 5. Running the Service

```bash
uvicorn main:app --reload --port 8080
```

## 📊 API Endpoints

### POST /query
Processes natural language questions and returns SQL results.

```python
# Example request
{
    "question": "How many patients are in Stage IV?",
    "history": [
        {"role": "user", "content": "previous question"},
        {"role": "assistant", "content": "previous answer"}
    ]
}
```

### POST /generate-title
Generates a title for the conversation based on context.

## 📝 Example Questions

The assistant handles various healthcare queries:
* Patient statistics
* Treatment outcomes
* Doctor-patient relationships
* Medical procedures
* Lab results analysis

## 🔧 Development

Key components:
* `main.py`: FastAPI application and route handlers
* `helper.py`: Core functionality for database operations and AI processing
* `prompt.py`: LangChain prompt templates for AI interactions

## 📚 Database Schema

The system works with a healthcare database including tables for:
* Patient records
* Cancer diagnoses
* Treatment plans
* Medical procedures
* Lab results
* Doctor notes