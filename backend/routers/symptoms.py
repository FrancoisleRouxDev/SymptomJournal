from fastapi import APIRouter, HTTPException, Depends, Request
from models.symptom import SymptomLogCreate, SymptomLogWithTriggers
from services.auth_service import verify_token
from services.rate_limiter import limiter
from supabase import create_client
from dotenv import load_dotenv
from services.logger import get_logger
import os

load_dotenv()

router = APIRouter(prefix="/symptoms", tags=["symptoms"])
logger = get_logger("symptoms")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


@router.post("/log")
@limiter.limit("30/hour")
async def log_symptom(
    request: Request,
    symptom: SymptomLogWithTriggers,
    user_id: str = Depends(verify_token)
):
    try:
        log_data = {
            "user_id": user_id,
            "description": symptom.description,
            "severity": symptom.severity,
            "time_of_day": symptom.time_of_day,
            "mood": symptom.mood,
        }

        result = supabase.table("symptom_logs").insert(log_data).execute()

        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to log symptom")

        log_id = result.data[0]["id"]

        if symptom.triggers:
            trigger_data = [
                {
                    "log_id": log_id,
                    "trigger_type": t.trigger_type,
                    "trigger_value": t.trigger_value,
                }
                for t in symptom.triggers
            ]
            supabase.table("triggers").insert(trigger_data).execute()

        return {
            "message": "Symptom logged successfully",
            "log_id": log_id
        }

    except Exception as e:
        logger.error(f"Error in log_symptom: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
@limiter.limit("60/hour")
async def get_symptom_history(
    request: Request,
    user_id: str = Depends(verify_token)
):
    try:
        result = supabase.table("symptom_logs")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()

        return {"symptoms": result.data}

    except Exception as e:
        logger.error(f"Error in get_symptom_history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{log_id}")
@limiter.limit("60/hour")
async def get_single_log(
    request: Request,
    log_id: str,
    user_id: str = Depends(verify_token)
):
    try:
        result = supabase.table("symptom_logs")\
            .select("*, triggers(*)")\
            .eq("id", log_id)\
            .eq("user_id", user_id)\
            .single()\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Log not found")

        return result.data

    except Exception as e:
        logger.error(f"Error in get_single_log: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{log_id}")
@limiter.limit("30/hour")
async def delete_log(
    request: Request,
    log_id: str,
    user_id: str = Depends(verify_token)
):
    try:
        supabase.table("symptom_logs")\
            .delete()\
            .eq("id", log_id)\
            .eq("user_id", user_id)\
            .execute()

        return {"message": "Log deleted successfully"}

    except Exception as e:
        logger.error(f"Error in delete_log: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))