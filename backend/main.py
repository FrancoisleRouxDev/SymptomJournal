from fastapi import FastAPI
from dotenv import load_dotenv
from supabase import create_client
from routers import symptoms, analysis
import os

load_dotenv()

app = FastAPI(title="SymptomJournal API")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Include routers
app.include_router(symptoms.router)
app.include_router(analysis.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Symptom Journal API"}