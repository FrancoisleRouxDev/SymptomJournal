from fastapi import FastAPI
from dotenv import load_dotenv
from supabase import create_client
import os

load_dotenv()

app = FastAPI()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@app.get("/")
def root():
    return {"message": "Welcome to the Symptom Journal API"}    