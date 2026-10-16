import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.auth_service import verify_token
from main import app
from routers.analysis import _most_frequent_symptom

client = TestClient(app)

TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"
app.dependency_overrides[verify_token] = lambda: TEST_USER_ID

def make_mock_log(desc="Headache", severity=6, time_of_day="morning"):
    return {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": TEST_USER_ID,
        "description": desc,
        "severity": severity,
        "time_of_day": time_of_day,
        "created_at": "2026-10-10T09:00:00"
    }


class TestAnalysisHelpers:
    def test_most_frequent_symptom_empty(self):
        assert _most_frequent_symptom([]) == "Unknown"
        assert _most_frequent_symptom([{}]) == "Unknown"

    def test_most_frequent_symptom_counts(self):
        logs = [
            {"description": "headache"},
            {"description": "Fatigue"},
            {"description": "headache"},
        ]
        assert _most_frequent_symptom(logs) == "Headache"


class TestPatternsEndpoint:
    @patch("routers.analysis.supabase")
    def test_patterns_not_enough_entries(self, mock_supabase):
        mock_result = MagicMock()
        mock_result.data = [make_mock_log("Headache"), make_mock_log("Fatigue")]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_result

        response = client.get("/analysis/patterns")
        assert response.status_code == 200
        data = response.json()
        assert data["ready"] is False
        assert data["entries_count"] == 2
        assert "Log at least 3 symptoms" in data["message"]

    @patch("routers.analysis.analyse_patterns")
    @patch("routers.analysis.supabase")
    def test_patterns_success(self, mock_supabase, mock_analyse):
        mock_result = MagicMock()
        mock_result.data = [
            make_mock_log("Headache"),
            make_mock_log("Fatigue"),
            make_mock_log("Nausea")
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_result
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

        mock_analyse.return_value = {
            "key_findings": [{"title": "Sleep", "description": "Correlation with fatigue"}],
            "time_pattern": "Afternoon peaks",
            "suggestion": "Keep consistent sleep schedule"
        }

        response = client.get("/analysis/patterns")
        assert response.status_code == 200
        data = response.json()
        assert data["ready"] is True
        assert data["entries_analysed"] == 3
        assert "analysis" in data
        assert data["analysis"]["time_pattern"] == "Afternoon peaks"


class TestSummaryEndpoint:
    @patch("routers.analysis.supabase")
    def test_summary_not_enough_entries(self, mock_supabase):
        mock_result = MagicMock()
        mock_result.data = [make_mock_log("Headache")]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_result

        response = client.post("/analysis/summary")
        assert response.status_code == 400
        assert "Need at least 3 symptom logs" in response.json()["detail"]

    @patch("routers.analysis.generate_doctor_summary")
    @patch("routers.analysis.supabase")
    def test_summary_success(self, mock_supabase, mock_gen_summary):
        logs = [
            make_mock_log("Migraine", 8),
            make_mock_log("Migraine", 7),
            make_mock_log("Fatigue", 5)
        ]
        logs_mock = MagicMock()
        logs_mock.data = logs

        ai_mock = MagicMock()
        ai_mock.data = [{
            "trigger_summary": "Morning flareups",
            "recommendation": "Hydration"
        }]

        insert_mock = MagicMock()
        insert_mock.data = [{"id": "sum-123"}]

        def table_dispatch(table_name):
            chain = MagicMock()
            if table_name == "symptom_logs":
                chain.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = logs_mock
            elif table_name == "ai_analysis":
                chain.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = ai_mock
            elif table_name == "doctor_summaries":
                chain.insert.return_value.execute.return_value = insert_mock
            return chain

        mock_supabase.table.side_effect = table_dispatch
        mock_gen_summary.return_value = "Patient presents with recurring morning migraines."

        response = client.post("/analysis/summary")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert data["summary_id"] == "sum-123"
        assert "migraines" in data["summary"]


class TestMedicationChatEndpoint:
    @patch("routers.analysis.answer_medication_query")
    def test_chat_success(self, mock_answer):
        mock_answer.return_value = "Paracetamol should be taken as directed, maximum 4g daily."
        response = client.post(
            "/analysis/chat",
            json={"query": "What is the recommended dosage for Paracetamol?", "history": []}
        )
        assert response.status_code == 200
        assert "Paracetamol" in response.json()["response"]

    def test_chat_empty_query(self):
        response = client.post("/analysis/chat", json={"query": ""})
        assert response.status_code == 422  # Pydantic validation error for min_length=1

    @patch("routers.analysis.answer_medication_query")
    def test_chat_value_error(self, mock_answer):
        mock_answer.side_effect = ValueError("Invalid safety threshold")
        response = client.post("/analysis/chat", json={"query": "dangerous query"})
        assert response.status_code == 400
