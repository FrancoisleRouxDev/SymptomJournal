import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.auth_service import verify_token
from main import app

client = TestClient(app)

# Override auth for testing
app.dependency_overrides[verify_token] = lambda: TEST_USER_ID

TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

# ── Mock data ─────────────────────────────────────────────────

MOCK_LOGS = [
    {
        "id": "log-001",
        "user_id": TEST_USER_ID,
        "description": "Tension headache",
        "severity": 6,
        "time_of_day": "afternoon",
        "mood": "stressed",
        "created_at": "2026-09-22T14:30:00",
        "triggers": [{"trigger_type": "sleep", "trigger_value": "less than 6 hours"}]
    },
    {
        "id": "log-002",
        "user_id": TEST_USER_ID,
        "description": "Low energy",
        "severity": 4,
        "time_of_day": "morning",
        "mood": "tired",
        "created_at": "2026-09-21T09:15:00",
        "triggers": []
    },
    {
        "id": "log-003",
        "user_id": TEST_USER_ID,
        "description": "Tension headache",
        "severity": 7,
        "time_of_day": "afternoon",
        "mood": "anxious",
        "created_at": "2026-09-20T15:00:00",
        "triggers": [{"trigger_type": "stress", "trigger_value": "work deadline"}]
    }
]

MOCK_ANALYSIS = {
    "most_frequent_symptom": "Tension headache",
    "average_severity": 5.7,
    "key_findings": [
        {
            "title": "Sleep connection",
            "description": "Headaches occur more often after fewer than 6 hours of sleep."
        },
        {
            "title": "Afternoon peak",
            "description": "Most symptoms appear between 1-4 PM."
        }
    ],
    "time_pattern": "Symptoms tend to peak in the afternoon",
    "suggestion": "Consider discussing your sleep patterns with your doctor."
}

MOCK_SUMMARY = """PATIENT REPORT

Overview
The patient has logged 3 symptom entries over the past 3 days.

Most Frequent Symptoms
- Tension Headache (2x, avg severity 6.5/10)
- Low Energy (1x, severity 4/10)

Patterns & Notes
- Headaches correlate with poor sleep and afternoon hours
- Stress identified as a recurring trigger

Questions to Discuss
- Could sleep quality be contributing to headache frequency?
- Are there strategies to manage afternoon energy dips?"""


# ── Helper mocks ──────────────────────────────────────────────

def mock_logs_response(data=MOCK_LOGS):
    mock = MagicMock()
    mock.data = data
    return mock

def mock_analysis_response():
    mock = MagicMock()
    mock.data = [{
        "id": "analysis-001",
        "user_id": TEST_USER_ID,
        "trigger_summary": "Symptoms peak in the afternoon",
        "recommendation": "Discuss sleep patterns with your doctor.",
        "generated_at": "2026-09-22T16:00:00"
    }]
    return mock

def mock_summary_insert():
    mock = MagicMock()
    mock.data = [{"id": "summary-001"}]
    return mock


# ── Tests ─────────────────────────────────────────────────────

class TestAIPatternAnalysis:

    @patch("routers.analysis.supabase")
    @patch("routers.analysis.analyse_patterns")
    def test_get_patterns_success(self, mock_analyse, mock_supabase):
        """Test successful pattern analysis with enough logs"""
        mock_supabase.table.return_value.select.return_value\
            .eq.return_value.order.return_value\
            .limit.return_value.execute.return_value = mock_logs_response()

        mock_supabase.table.return_value.insert.return_value\
            .execute.return_value = MagicMock(data=[])

        mock_analyse.return_value = MOCK_ANALYSIS

        response = client.get(
            "/analysis/patterns"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["ready"] == True
        assert data["entries_analysed"] == 3
        assert "analysis" in data
        print("✅ test_get_patterns_success passed")

    @patch("routers.analysis.supabase")
    def test_get_patterns_insufficient_data(self, mock_supabase):
        """Test that analysis is blocked with fewer than 3 entries"""
        mock_supabase.table.return_value.select.return_value\
            .eq.return_value.order.return_value\
            .limit.return_value.execute.return_value = mock_logs_response(
                data=MOCK_LOGS[:1]
            )

        response = client.get(
            "/analysis/patterns"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["ready"] == False
        assert "entries_count" in data
        assert data["entries_count"] == 1
        print("✅ test_get_patterns_insufficient_data passed")

    @patch("routers.analysis.supabase")
    def test_get_patterns_missing_user_id(self, mock_supabase):
        """Test that patterns endpoint requires valid auth token"""
        app.dependency_overrides.clear()

        response = client.get("/analysis/patterns")

        app.dependency_overrides[verify_token] = lambda: TEST_USER_ID

        assert response.status_code == 401
        print("✅ test_get_patterns_missing_user_id passed")

    @patch("routers.analysis.supabase")
    @patch("routers.analysis.analyse_patterns")
    def test_analysis_contains_required_fields(self, mock_analyse, mock_supabase):
        """Test that analysis response contains all required fields"""
        mock_supabase.table.return_value.select.return_value\
            .eq.return_value.order.return_value\
            .limit.return_value.execute.return_value = mock_logs_response()

        mock_supabase.table.return_value.insert.return_value\
            .execute.return_value = MagicMock(data=[])

        mock_analyse.return_value = MOCK_ANALYSIS

        response = client.get(
            "/analysis/patterns"
        )

        analysis = response.json()["analysis"]
        assert "most_frequent_symptom" in analysis
        assert "average_severity" in analysis
        assert "key_findings" in analysis
        assert "time_pattern" in analysis
        assert "suggestion" in analysis
        print("✅ test_analysis_contains_required_fields passed")


class TestDoctorSummary:

    @patch("routers.analysis.supabase")
    @patch("routers.analysis.generate_doctor_summary")
    def test_generate_summary_success(self, mock_generate, mock_supabase):
        """Test successful doctor summary generation"""
        def mock_table(table_name):
            mock = MagicMock()
            if table_name == "symptom_logs":
                mock.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_logs_response()
            elif table_name == "ai_analysis":
                mock.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_analysis_response()
            elif table_name == "doctor_summaries":
                mock.insert.return_value.execute.return_value = mock_summary_insert()
            return mock

        mock_supabase.table.side_effect = mock_table
        mock_generate.return_value = MOCK_SUMMARY

        response = client.post(
            "/analysis/summary"
        )

        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        print("✅ test_generate_summary_success passed")

    @patch("routers.analysis.supabase")
    def test_generate_summary_insufficient_data(self, mock_supabase):
        """Test summary blocked with fewer than 3 entries"""
        mock_supabase.table.return_value.select.return_value\
            .eq.return_value.order.return_value\
            .limit.return_value.execute.return_value = mock_logs_response(
                data=MOCK_LOGS[:2]
            )

        response = client.post(
            "/analysis/summary"
        )

        assert response.status_code == 400
        print("✅ test_generate_summary_insufficient_data passed")

    @patch("routers.analysis.supabase")
    def test_generate_summary_missing_user_id(self, mock_supabase):
        """Test summary endpoint requires valid auth token"""
        app.dependency_overrides.clear()

        response = client.post("/analysis/summary")

        app.dependency_overrides[verify_token] = lambda: TEST_USER_ID

        assert response.status_code == 401
        print("✅ test_generate_summary_missing_user_id passed")


class TestAIService:

    def test_analyse_patterns_structure(self):
        """Test that analyse_patterns returns correct structure with mocked AI"""
        with patch("services.ai_service.client") as mock_client:
            import json
            mock_response = MagicMock()
            mock_response.choices[0].message.content = json.dumps(MOCK_ANALYSIS)
            mock_client.chat.completions.create.return_value = mock_response

            from services.ai_service import analyse_patterns
            result = analyse_patterns(MOCK_LOGS)

            assert "most_frequent_symptom" in result
            assert "key_findings" in result
            assert isinstance(result["key_findings"], list)
            # average_severity should be computed locally, not from AI JSON
            assert result["average_severity"] == 5.7  # (6+4+7)/3 = 5.666... → 5.7
            print("✅ test_analyse_patterns_structure passed")

    def test_analyse_patterns_fallback_on_invalid_json(self):
        """Test that invalid AI JSON response returns safe fallback"""
        with patch("services.ai_service.client") as mock_client:
            mock_response = MagicMock()
            mock_response.choices[0].message.content = "This is not valid JSON at all"
            mock_client.chat.completions.create.return_value = mock_response

            from services.ai_service import analyse_patterns
            result = analyse_patterns(MOCK_LOGS)

            assert "most_frequent_symptom" in result
            assert "key_findings" in result
            assert result["most_frequent_symptom"] == "Unable to determine"
            # Even on fallback, average_severity should be the locally computed value
            assert result["average_severity"] == 5.7
            print("✅ test_analyse_patterns_fallback_on_invalid_json passed")

    def test_analyse_patterns_raises_on_empty_logs(self):
        """Test that passing no logs raises ValueError"""
        from services.ai_service import analyse_patterns
        with pytest.raises(ValueError, match="no symptom logs"):
            analyse_patterns([])
        print("✅ test_analyse_patterns_raises_on_empty_logs passed")

    def test_generate_doctor_summary_returns_string(self):
        """Test that doctor summary returns a string"""
        with patch("services.ai_service.client") as mock_client:
            mock_response = MagicMock()
            mock_response.choices[0].message.content = MOCK_SUMMARY
            mock_client.chat.completions.create.return_value = mock_response

            from services.ai_service import generate_doctor_summary
            result = generate_doctor_summary(MOCK_LOGS, MOCK_ANALYSIS)

            assert isinstance(result, str)
            assert len(result) > 0
            print("✅ test_generate_doctor_summary_returns_string passed")

    def test_generate_doctor_summary_raises_on_empty_logs(self):
        """Test that passing no logs to summary raises ValueError"""
        from services.ai_service import generate_doctor_summary
        with pytest.raises(ValueError, match="no symptom logs"):
            generate_doctor_summary([], MOCK_ANALYSIS)
        print("✅ test_generate_doctor_summary_raises_on_empty_logs passed")

    def test_strip_json_fences_plain_json(self):
        """Test _strip_json_fences handles raw JSON with no fences"""
        from services.ai_service import _strip_json_fences
        raw = '{"key": "value"}'
        assert _strip_json_fences(raw) == raw
        print("✅ test_strip_json_fences_plain_json passed")

    def test_strip_json_fences_with_json_tag(self):
        """Test _strip_json_fences strips ```json ... ``` fences"""
        from services.ai_service import _strip_json_fences
        fenced = '```json\n{"key": "value"}\n```'
        assert _strip_json_fences(fenced) == '{"key": "value"}'
        print("✅ test_strip_json_fences_with_json_tag passed")

    def test_strip_json_fences_without_tag(self):
        """Test _strip_json_fences strips plain ``` ... ``` fences"""
        from services.ai_service import _strip_json_fences
        fenced = '```\n{"key": "value"}\n```'
        assert _strip_json_fences(fenced) == '{"key": "value"}'
        print("✅ test_strip_json_fences_without_tag passed")

    def test_format_triggers_empty(self):
        """Test _format_triggers returns 'None noted' for empty list"""
        from services.ai_service import _format_triggers
        assert _format_triggers([]) == "None noted"
        print("✅ test_format_triggers_empty passed")

    def test_format_triggers_with_values(self):
        """Test _format_triggers formats trigger dicts into readable text"""
        from services.ai_service import _format_triggers
        triggers = [
            {"trigger_type": "sleep", "trigger_value": "less than 6 hours"},
            {"trigger_type": "stress", "trigger_value": "work deadline"}
        ]
        result = _format_triggers(triggers)
        assert "sleep (less than 6 hours)" in result
        assert "stress (work deadline)" in result
        print("✅ test_format_triggers_with_values passed")

    def test_compute_average_severity_normal(self):
        """Test _compute_average_severity returns correct average"""
        from services.ai_service import _compute_average_severity
        logs = [{"severity": 6}, {"severity": 4}, {"severity": 7}]
        assert _compute_average_severity(logs) == 5.7
        print("✅ test_compute_average_severity_normal passed")

    def test_compute_average_severity_with_nulls(self):
        """Test _compute_average_severity skips None severity values"""
        from services.ai_service import _compute_average_severity
        logs = [{"severity": 6}, {"severity": None}, {"severity": 8}]
        assert _compute_average_severity(logs) == 7.0
        print("✅ test_compute_average_severity_with_nulls passed")

    def test_compute_average_severity_all_nulls(self):
        """Test _compute_average_severity returns None if no severities"""
        from services.ai_service import _compute_average_severity
        logs = [{"severity": None}, {"severity": None}]
        assert _compute_average_severity(logs) is None
        print("✅ test_compute_average_severity_all_nulls passed")