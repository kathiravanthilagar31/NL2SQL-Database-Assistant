import pandas as pd
from sqlalchemy import create_engine
from zipfile import ZipFile
import os

# PostgreSQL credentials
DB_USER = "postgres"
DB_PASS = "kathi-97"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "oncology_db"


# Create SQLAlchemy engine
engine = create_engine(f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Path to your ZIP file
zip_path = r"D:\1 Kathir-Hope AI\Projects\GenAI\NL to SQL\data\oncology_datasets_realistic.zip"

# Temporary extract directory
extract_dir = r"D:\1 Kathir-Hope AI\Projects\GenAI\NL to SQL\data\oncology_tmp"

# Extract all files
with ZipFile(zip_path, "r") as zip_ref:
    zip_ref.extractall(extract_dir)

# Loop through extracted Excel files
for file_name in os.listdir(extract_dir):
    if file_name.endswith(".xlsx"):
        table_name = os.path.splitext(file_name)[0]  # get file name without extension
        table_name = table_name.strip().lower().replace(" ", "_")  # clean table name

        file_path = os.path.join(extract_dir, file_name)
        df = pd.read_excel(file_path)

        # Clean column names
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        # Save DataFrame to PostgreSQL
        df.to_sql(table_name, engine, if_exists="replace", index=False)
        print(f"{file_name} → {table_name} loaded into PostgreSQL")

print(" All oncology datasets from ZIP saved into PostgreSQL successfully!")
