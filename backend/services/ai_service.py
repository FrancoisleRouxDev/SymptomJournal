from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY")
)

MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.2-11b-vision-instruct")


def _format_triggers(triggers: list[dict]) -> str:
    """Convert a list of trigger dicts into a readable string for the prompt."""
    if not triggers:
        return "None noted"
    return ", ".join(
        f"{t.get('trigger_type', '?')} ({t.get('trigger_value', '?')})"
        for t in triggers
    )


def _strip_json_fences(text: str) -> str:
    """
    Robustly strips markdown code fences from an AI response.
    Handles ```json ... ```, ``` ... ```, and bare JSON alike.
    """
    # Match optional language tag after opening fence
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text.strip()


def _compute_average_severity(logs: list[dict]) -> float | None:
    """Compute average severity locally — never trust the AI for this."""
    values = [
        log["severity"]
        for log in logs
        if log.get("severity") is not None
    ]
    if not values:
        return None
    return round(sum(values) / len(values), 1)


def analyse_patterns(symptom_logs: list[dict]) -> dict:
    """
    Analyses a list of symptom log entries and identifies patterns,
    triggers, and trends. Returns structured findings.

    Raises ValueError if no logs are provided.
    """
    if not symptom_logs:
        raise ValueError("Cannot analyse patterns with no symptom logs.")

    # Compute average severity deterministically before calling the AI
    avg_severity = _compute_average_severity(symptom_logs)

    # Format logs into readable text for the prompt
    formatted_logs = ""
    for i, log in enumerate(symptom_logs, 1):
        triggers_text = _format_triggers(log.get("triggers") or [])
        formatted_logs += f"""
Entry {i}:
- Date: {log.get('created_at', 'Unknown')}
- Symptom: {log.get('description', 'Not specified')}
- Severity: {log.get('severity', 'Not rated')}/10
- Time of day: {log.get('time_of_day', 'Not specified')}
- Mood: {log.get('mood', 'Not specified')}
- Triggers: {triggers_text}
"""

    prompt = f"""You are a calm, supportive health journal assistant. 
You help users understand patterns in their symptom history.

IMPORTANT RULES:
- Never suggest a diagnosis or medical condition
- Never recommend medications or treatments  
- Never use alarming language
- Always suggest speaking to a doctor for medical advice
- Be warm, calm and factual

Here are the user's recent symptom log entries:
{formatted_logs}

Analyse these entries and respond with ONLY a JSON object in this exact format:
{{
    "most_frequent_symptom": "the symptom that appears most often",
    "key_findings": [
        {{
            "title": "short finding title",
            "description": "one calm, factual sentence about this pattern"
        }}
    ],
    "time_pattern": "brief description of when symptoms tend to occur",
    "suggestion": "one gentle suggestion to discuss with their doctor"
}}

Respond with ONLY the JSON. No explanation, no preamble."""

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a calm health journal assistant. You identify patterns in symptom logs. You never diagnose or alarm users. You always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=600,
            temperature=0.3
        )

        response_text = completion.choices[0].message.content.strip()
        clean_text = _strip_json_fences(response_text)
        result = json.loads(clean_text)

        # Inject the locally-computed average severity — never from AI
        result["average_severity"] = avg_severity if avg_severity is not None else "N/A"

        return result

    except json.JSONDecodeError:
        # If AI returns invalid JSON, return a safe fallback
        return {
            "most_frequent_symptom": "Unable to determine",
            "average_severity": avg_severity if avg_severity is not None else "N/A",
            "key_findings": [
                {
                    "title": "More data needed",
                    "description": "Log more symptoms over the next few days for a meaningful analysis."
                }
            ],
            "time_pattern": "Not enough data",
            "suggestion": "Continue logging your symptoms daily and speak to your doctor about any concerns."
        }

    except Exception as e:
        raise Exception(f"AI analysis failed: {str(e)}")


def generate_doctor_summary(symptom_logs: list[dict], analysis: dict) -> str:
    """
    Generates a structured, professional doctor summary from
    symptom logs and AI analysis findings.
    """
    if not symptom_logs:
        raise ValueError("Cannot generate a summary with no symptom logs.")

    formatted_logs = ""
    for log in symptom_logs:
        triggers_text = _format_triggers(log.get("triggers") or [])
        formatted_logs += (
            f"- {log.get('created_at', '')[:10]}: "
            f"{log.get('description')} "
            f"(severity {log.get('severity', 'N/A')}/10"
            f"{', triggers: ' + triggers_text if triggers_text != 'None noted' else ''})\n"
        )

    findings = "\n".join([
        f"- {f['title']}: {f['description']}"
        for f in analysis.get('key_findings', [])
    ])

    avg = analysis.get('average_severity', 'N/A')
    avg_display = f"{avg}/10" if avg != "N/A" else "N/A"

    prompt = f"""You are a health journal assistant helping a patient prepare for a doctor's appointment.

Generate a clear, professional patient summary based on these symptom logs and findings.

SYMPTOM HISTORY:
{formatted_logs}

PATTERNS IDENTIFIED:
- Most frequent symptom: {analysis.get('most_frequent_symptom')}
- Average severity: {avg_display}
- Time pattern: {analysis.get('time_pattern')}
{findings}

IMPORTANT RULES:
- Write in third person as a patient report
- Be factual and calm — no alarming language
- Never suggest a diagnosis or medication
- Keep it concise and structured
- Use plain, professional English a doctor can read quickly

Format the summary with these sections:
PATIENT REPORT
Overview
Most Frequent Symptoms
Patterns & Notes
Questions to Discuss

Write the summary now:"""

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a clinical health journal assistant. You write clear, calm, factual patient summaries for doctor appointments. You never diagnose or alarm patients."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=800,
            temperature=0.2
        )

        return completion.choices[0].message.content.strip()

    except Exception as e:
        raise Exception(f"Summary generation failed: {str(e)}")


def answer_medication_query(question: str, conversation_history: list[dict] = None) -> str:
    """
    Answers patient questions regarding medications, common side effects,
    intake guidance, interactions, and general wellness.
    Maintains responsible medical guidance and safety guardrails.
    """
    if not question or not question.strip():
        raise ValueError("Question cannot be empty.")

    system_prompt = (
        "You are an AI Medication & Health Assistant for SymptomJournal. "
        "You provide factual, empathetic, clear information regarding medications, dosage safety, "
        "side effects, interactions, and general health tracking tips. "
        "Always remind the user to consult their doctor or pharmacist for clinical prescriptions, "
        "and never prescribe or claim definitive medical diagnosis. "
        "Keep answers concise, direct, and easy to understand for patients."
    )

    messages = [{"role": "system", "content": system_prompt}]

    if conversation_history:
        for msg in conversation_history[-6:]:
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("text", "")})

    messages.append({"role": "user", "content": question.strip()})

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.3
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        raise Exception(f"AI Assistant query failed: {str(e)}")