from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY")
)

MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.2-11b-vision-instruct")

def analyse_patterns(symptom_logs: list[dict]) -> dict:
    """
    Analyses a list of symptom log entries and identifies patterns,
    triggers, and trends. Returns structured findings.
    """

    # Format logs into readable text for the prompt
    formatted_logs = ""
    for i, log in enumerate(symptom_logs, 1):
        formatted_logs += f"""
Entry {i}:
- Date: {log.get('created_at', 'Unknown')}
- Symptom: {log.get('description', 'Not specified')}
- Severity: {log.get('severity', 'Not rated')}/10
- Time of day: {log.get('time_of_day', 'Not specified')}
- Mood: {log.get('mood', 'Not specified')}
- Triggers: {log.get('triggers', 'None noted')}
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
    "average_severity": "average severity score as a number",
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

        # Clean up response if model adds markdown fences
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]

        return json.loads(response_text)

    except json.JSONDecodeError:
        # If AI returns invalid JSON, return a safe fallback
        return {
            "most_frequent_symptom": "Unable to determine",
            "average_severity": "N/A",
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

    formatted_logs = ""
    for log in symptom_logs:
        formatted_logs += f"- {log.get('created_at', '')[:10]}: {log.get('description')} (severity {log.get('severity', 'N/A')}/10)\n"

    findings = "\n".join([
        f"- {f['title']}: {f['description']}"
        for f in analysis.get('key_findings', [])
    ])

    prompt = f"""You are a health journal assistant helping a patient prepare for a doctor's appointment.

Generate a clear, professional patient summary based on these symptom logs and findings.

SYMPTOM HISTORY:
{formatted_logs}

PATTERNS IDENTIFIED:
- Most frequent symptom: {analysis.get('most_frequent_symptom')}
- Average severity: {analysis.get('average_severity')}/10
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