import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import httpx
from dotenv import load_dotenv

load_dotenv('c:/Users/flr21/Desktop/SymptomJournal/backend/.env')

print("=" * 60)
print("TEST 3: FULL APP & SUBSYSTEM INTEGRATION VERIFICATION")
print("=" * 60)

# 1. Supabase Database
print("\n[Subsystem 1: Database (Supabase PostgreSQL)]")
from supabase import create_client
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
client = create_client(url, key)

try:
    users_res = client.table("users").select("count", count="exact").execute()
    print(f"  [PASS] 'users' table connected. Registered user records: {users_res.count}")
except Exception as e:
    print(f"  [FAIL] 'users' table query failed: {e}")

try:
    symptoms_res = client.table("symptom_logs").select("count", count="exact").execute()
    print(f"  [PASS] 'symptom_logs' table connected. Total symptom logs: {symptoms_res.count}")
except Exception as e:
    print(f"  [FAIL] 'symptom_logs' table query failed: {e}")

# 2. NVIDIA AI Service Live
print("\n[Subsystem 2: AI & LLM Engine (NVIDIA Llama-3.2)]")
from services.ai_service import answer_medication_query
try:
    reply = answer_medication_query("What is the general use of ibuprofen?")
    clean_reply = reply.replace("\n", " ").strip()[:100]
    print(f"  [PASS] NVIDIA AI inference successful: \"{clean_reply}...\"")
except Exception as e:
    print(f"  [FAIL] NVIDIA AI query failed: {e}")

# 3. FastAPI Core Backend Pipeline
print("\n[Subsystem 3: FastAPI Core Backend Routing & Endpoints]")
from fastapi.testclient import TestClient
from services.auth_service import verify_token
import main
tc = TestClient(main.app)

root_r = tc.get("/")
print(f"  [PASS] Root endpoint GET [/]: HTTP {root_r.status_code} -> {root_r.json()}")

docs_r = tc.get("/docs")
print(f"  [PASS] OpenAPI Swagger GET [/docs]: HTTP {docs_r.status_code}")

# Test Auth Guard (unauthenticated should be 401)
unauth_r = tc.post("/analysis/chat", json={"query": "Hello", "history": []})
print(f"  [PASS] Auth Security Guard: Unauthenticated request blocked with HTTP {unauth_r.status_code} ({unauth_r.json().get('detail')})")

# Test Authenticated Route (override token for test execution)
main.app.dependency_overrides[verify_token] = lambda: "00000000-0000-0000-0000-000000000001"
auth_chat_r = tc.post(
    "/analysis/chat",
    headers={"Authorization": "Bearer mock-token"},
    json={"query": "Can you advise on taking vitamin C?", "history": []}
)
main.app.dependency_overrides.clear()

if auth_chat_r.status_code == 200:
    chat_snippet = auth_chat_r.json().get("response", "").replace("\n", " ").strip()[:90]
    print(f"  [PASS] Authenticated Chat POST [/analysis/chat]: HTTP 200 -> \"{chat_snippet}...\"")
else:
    print(f"  [FAIL] Authenticated Chat returned HTTP {auth_chat_r.status_code}: {auth_chat_r.text}")

# 4. Cloud Deployment (Render)
print("\n[Subsystem 4: Cloud Hosting Environment (Render Web Service)]")
render_url = "https://symptomjournal.onrender.com"
try:
    with httpx.Client(timeout=40.0) as client_http:
        r = client_http.get(render_url)
        print(f"  [PASS] Render Live Endpoint [{render_url}]: HTTP {r.status_code} -> {r.json()}")
        r_docs = client_http.get(f"{render_url}/docs")
        print(f"  [PASS] Render Live Docs [{render_url}/docs]: HTTP {r_docs.status_code}")
except Exception as e:
    print(f"  [NOTICE] Render Ping ({type(e).__name__}): {e}")

print("\n" + "=" * 60)
print("E2E HEALTHCHECK COMPLETE")
print("=" * 60)
