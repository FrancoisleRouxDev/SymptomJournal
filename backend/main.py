from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Welcome to the Symptom Journal API"}    