from fastapi import APIRouter, HTTPException, Depends, Request
from models.symptom import SymptomLogCreate, SymptomLogWithTriggers
from services.auth_service import verify_token, ensure_user_profile
from services.rate_limiter import limiter
from supabase import create_client
from dotenv import load_dotenv
from services.logger import get_logger
import os
import re

load_dotenv()

router = APIRouter(prefix="/symptoms", tags=["symptoms"])
logger = get_logger("symptoms")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

_TZ_SUFFIX = re.compile(r"(Z|[+-]\d{2}:?\d{2})$")


def _mark_utc(log: dict) -> dict:
    """
    Timestamps are stored in UTC, but a column without a time zone comes back
    with no offset, which clients then misread as local time. Append 'Z' so
    the value is unambiguous.
    """
    ts = log.get("created_at")
    if isinstance(ts, str) and not _TZ_SUFFIX.search(ts):
        log["created_at"] = ts + "Z"
    return log


@router.post("/log")
@limiter.limit("120/hour")
def log_symptom(
    request: Request,
    symptom: SymptomLogWithTriggers,
    user_id: str = Depends(verify_token)
):
    try:
        ensure_user_profile(user_id)

        log_data = {
            "user_id": user_id,
            "description": symptom.description,
            "severity": symptom.severity,
            "time_of_day": symptom.time_of_day,
            "mood": symptom.mood,
        }

        if symptom.occurred_at:
            log_data["created_at"] = symptom.occurred_at.isoformat()

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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in log_symptom: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not save symptom log")


@router.get("/history")
@limiter.limit("180/hour")
def get_symptom_history(
    request: Request,
    user_id: str = Depends(verify_token)
):
    try:
        result = supabase.table("symptom_logs")\
            .select("*, triggers(*)")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()

        return {"symptoms": [_mark_utc(log) for log in result.data]}

    except Exception as e:
        logger.error(f"Error in get_symptom_history: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load symptom history")


@router.get("/history/{log_id}")
@limiter.limit("60/hour")
def get_single_log(
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

        return _mark_utc(result.data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_single_log: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load symptom log")


@router.delete("/history/{log_id}")
@limiter.limit("30/hour")
def delete_log(
    request: Request,
    log_id: str,
    user_id: str = Depends(verify_token)
):
    try:
        # Confirm the log belongs to this user before touching its triggers
        owned = supabase.table("symptom_logs")\
            .select("id")\
            .eq("id", log_id)\
            .eq("user_id", user_id)\
            .execute()

        if not owned.data:
            raise HTTPException(status_code=404, detail="Log not found")

        # Delete dependent triggers associated with this log
        supabase.table("triggers")\
            .delete()\
            .eq("log_id", log_id)\
            .execute()

        # Then delete the symptom log
        supabase.table("symptom_logs")\
            .delete()\
            .eq("id", log_id)\
            .eq("user_id", user_id)\
            .execute()

        return {"message": "Log deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_log: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not delete symptom log")