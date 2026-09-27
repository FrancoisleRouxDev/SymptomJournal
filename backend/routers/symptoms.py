from fastapi import APIRouter, HTTPException, Header
from models.symptom import SymptomLogCreate, SymptomLogWithTriggers
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(prefix="/symptoms", tags=["symptoms"])

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@router.post("/log")
async def log_symptom(
    symptom: SymptomLogWithTriggers,
    user_id: str = Header(..., alias="x-user-id")
):
    try:
        # Insert symptom log
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

        # Insert triggers if any
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
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_symptom_history(
    user_id: str = Header(..., alias="x-user-id")
):
    try:
        result = supabase.table("symptom_logs")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()

        return {"symptoms": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{log_id}")
async def get_single_log(
    log_id: str,
    user_id: str = Header(..., alias="x-user-id")
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
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{log_id}")
async def delete_log(
    log_id: str,
    user_id: str = Header(..., alias="x-user-id")
):
    try:
        supabase.table("symptom_logs")\
            .delete()\
            .eq("id", log_id)\
            .eq("user_id", user_id)\
            .execute()

        return {"message": "Log deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))