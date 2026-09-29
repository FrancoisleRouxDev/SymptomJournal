from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from supabase import create_client
from routers import symptoms, analysis
from services.rate_limiter import limiter
import os

load_dotenv()

app = FastAPI(title="SymptomJournal API")

# Attach rate limiter
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests — please slow down and try again shortly."
        }
    )

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

app.include_router(symptoms.router)
app.include_router(analysis.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Symptom Journal API"}