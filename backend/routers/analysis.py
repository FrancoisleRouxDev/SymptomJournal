from fastapi import APIRouter, HTTPException, Depends, Request
from services.ai_service import analyse_patterns, generate_doctor_summary
from services.auth_service import verify_token
from services.rate_limiter import limiter
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(prefix="/analysis", tags=["analysis"])

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

MINIMUM_ENTRIES = 3


@router.get("/patterns")
@limiter.limit("10/hour")
async def get_patterns(
    request: Request,
    user_id: str = Depends(verify_token)
):
    try:
        result = supabase.table("symptom_logs")\
            .select("*, triggers(*)")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(30)\
            .execute()

        logs = result.data

        if len(logs) < MINIMUM_ENTRIES:
            return {
                "ready": False,
                "message": f"Log at least {MINIMUM_ENTRIES} symptoms to unlock AI pattern analysis. You have {len(logs)} so far.",
                "entries_count": len(logs)
            }

        analysis = analyse_patterns(logs)

        if logs:
            supabase.table("ai_analysis").insert({
                "user_id": user_id,
                "patterns_identified": str(analysis.get("key_findings")),
                "trigger_summary": analysis.get("time_pattern"),
                "recommendation": analysis.get("suggestion"),
                "entries_analysed": len(logs),
            }).execute()

        return {
            "ready": True,
            "entries_analysed": len(logs),
            "analysis": analysis
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summary")
@limiter.limit("5/hour")
async def generate_summary(
    request: Request,
    user_id: str = Depends(verify_token)
):
    try:
        logs_result = supabase.table("symptom_logs")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(30)\
            .execute()

        logs = logs_result.data

        if len(logs) < MINIMUM_ENTRIES:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least {MINIMUM_ENTRIES} symptom logs to generate a summary."
            )

        analysis_result = supabase.table("ai_analysis")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("generated_at", desc=True)\
            .limit(1)\
            .execute()

        if analysis_result.data:
            analysis = {
                "most_frequent_symptom": "See patterns below",
                "average_severity": "N/A",
                "key_findings": [],
                "time_pattern": analysis_result.data[0].get("trigger_summary", ""),
                "suggestion": analysis_result.data[0].get("recommendation", "")
            }
        else:
            analysis = analyse_patterns(logs)

        summary_text = generate_doctor_summary(logs, analysis)

        summary_result = supabase.table("doctor_summaries").insert({
            "user_id": user_id,
            "summary_text": summary_text,
            "exported": False
        }).execute()

        return {
            "summary": summary_text,
            "summary_id": summary_result.data[0]["id"] if summary_result.data else None
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        