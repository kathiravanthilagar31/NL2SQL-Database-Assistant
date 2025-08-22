# Natural Language to SQL Assistant 🔍

An intelligent API service that converts natural language questions into SQL queries using LangChain, GPT-4, and FastAPI.

## ✨ Features
* Natural language to SQL conversion
* Context-aware query generation
* Conversation history support
* Query optimization and validation
* Schema-aware SQL generation
* Comprehensive error handling

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
git clone https://github.com/kathiravanthilagar31/NL2SQL-Database-Assistant.git
cd NL2SQL-Database-Assistant
pip install -r requirements.txt
```

### 3. Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE your_database_name;
```

2. Import schema:
```bash
psql -U your_username -d your_database_name -f data/schema.sql
```

3. Verify schema files location:
```plaintext
data/
├── ddl.txt          # Contains table definitions
└── documentation.txt # Contains schema documentation
```

### 4. Environment Setup

Create a `.env` file in the project root:

```env
OPENAI_API_KEY="your_openai_api_key"
DB_USERNAME="your_db_username"
DB_PASSWORD="your_db_password"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="your_db_name"
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
    "question": "Your natural language question",
    "history": [
        {"role": "user", "content": "previous question"},
        {"role": "assistant", "content": "previous answer"}
    ]
}

# Example response
{
    "summary": "Human readable summary of results",
    "sql_query": "Generated SQL query"
}
```

### POST /generate-title
Generates a title for the conversation based on context.

## 🔧 Project Structure

```plaintext
project/
├── src/
│   ├── __init__.py
│   ├── helper.py      # Database and AI utilities
│   └── prompt.py      # LangChain prompt templates
├── data/
│   ├── ddl.txt       # Schema definitions
│   └── documentation.txt
├── main.py           # FastAPI application
├── requirements.txt
└── README.md
```

## 📝 Development

Key components:
* `main.py`: FastAPI application and route handlers
* `helper.py`: Core functionality for database operations and AI processing
* `prompt.py`: LangChain prompt templates for AI interactions