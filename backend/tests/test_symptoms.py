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

# Mock user ID for testing
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

# Mock Supabase responses
def mock_symptom_insert(*args, **kwargs):
    mock = MagicMock()
    mock.data = [{
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": TEST_USER_ID,
        "description": "Tension headache",
        "severity": 6,
        "time_of_day": "afternoon",
        "mood": "anxious",
        "created_at": "2026-09-22T14:30:00"
    }]
    return mock

def mock_symptom_history(*args, **kwargs):
    mock = MagicMock()
    mock.data = [
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "user_id": TEST_USER_ID,
            "description": "Tension headache",
            "severity": 6,
            "time_of_day": "afternoon",
            "created_at": "2026-09-22T14:30:00"
        },
        {
            "id": "223e4567-e89b-12d3-a456-426614174001",
            "user_id": TEST_USER_ID,
            "description": "Low energy",
            "severity": 4,
            "time_of_day": "morning",
            "created_at": "2026-09-22T09:15:00"
        }
    ]
    return mock


class TestSymptomLogging:

    @patch("routers.symptoms.supabase")
    def test_log_symptom_success(self, mock_supabase):
        """Test successfully logging a symptom"""
        mock_supabase.table.return_value.insert.return_value.execute = mock_symptom_insert

        response = client.post(
            "/symptoms/log",
            json={
                "description": "Tension headache",
                "severity": 6,
                "time_of_day": "afternoon",
                "mood": "anxious",
                "triggers": []
            }
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Symptom logged successfully"
        print("✅ test_log_symptom_success passed")

    @patch("routers.symptoms.supabase")
    def test_log_symptom_with_triggers(self, mock_supabase):
        """Test logging a symptom with triggers"""
        mock_supabase.table.return_value.insert.return_value.execute = mock_symptom_insert

        response = client.post(
            "/symptoms/log",
            json={
                "description": "Migraine",
                "severity": 8,
                "time_of_day": "morning",
                "mood": "stressed",
                "triggers": [
                    {"trigger_type": "sleep", "trigger_value": "less than 6 hours"},
                    {"trigger_type": "stress", "trigger_value": "work deadline"}
                ]
            }
        )

        assert response.status_code == 200
        print("✅ test_log_symptom_with_triggers passed")

    @patch("routers.symptoms.supabase")
    def test_log_symptom_missing_description(self, mock_supabase):
        """Test that logging fails without a description"""
        response = client.post(
            "/symptoms/log",
            json={
                "severity": 5,
                "time_of_day": "morning"
            }
        )

        assert response.status_code == 422
        print("✅ test_log_symptom_missing_description passed")

    @patch("routers.symptoms.supabase")
    def test_log_symptom_missing_user_id(self, mock_supabase):
        """Test that logging fails without a valid auth token"""
        # Temporarily remove the override to test real auth
        app.dependency_overrides.clear()

        response = client.post(
            "/symptoms/log",
            json={
                "description": "Headache",
                "severity": 5
            }
        )

        # Restore override for other tests
        app.dependency_overrides[verify_token] = lambda: TEST_USER_ID

        assert response.status_code == 401
        print("✅ test_log_symptom_missing_user_id passed")

    @patch("routers.symptoms.supabase")
    def test_get_symptom_history(self, mock_supabase):
        """Test retrieving symptom history"""
        mock_supabase.table.return_value.select.return_value\
            .eq.return_value.order.return_value.execute = mock_symptom_history

        response = client.get(
            "/symptoms/history"
        )

        assert response.status_code == 200
        assert "symptoms" in response.json()
        assert len(response.json()["symptoms"]) == 2
        print("✅ test_get_symptom_history passed")

    @patch("routers.symptoms.supabase")
    def test_severity_range(self, mock_supabase):
        """Test logging symptoms at boundary severity values"""
        mock_supabase.table.return_value.insert.return_value.execute = mock_symptom_insert

        # Test severity 1 (minimum)
        response = client.post(
            "/symptoms/log",
            json={"description": "Mild discomfort", "severity": 1}
        )
        assert response.status_code == 200

        # Test severity 10 (maximum)
        response = client.post(
            "/symptoms/log",
            json={"description": "Severe pain", "severity": 10}
        )
        assert response.status_code == 200
        print("✅ test_severity_range passed")

class TestInputValidation:

    @patch("routers.symptoms.supabase")
    def test_severity_below_minimum(self, mock_supabase):
        """Test that severity below 1 is rejected"""
        response = client.post(
            "/symptoms/log",
            json={"description": "Headache", "severity": 0}
        )
        assert response.status_code == 422
        print("✅ test_severity_below_minimum passed")

    @patch("routers.symptoms.supabase")
    def test_severity_above_maximum(self, mock_supabase):
        """Test that severity above 10 is rejected"""
        response = client.post(
            "/symptoms/log",
            json={"description": "Headache", "severity": 11}
        )
        assert response.status_code == 422
        print("✅ test_severity_above_maximum passed")

    @patch("routers.symptoms.supabase")
    def test_invalid_time_of_day(self, mock_supabase):
        """Test that invalid time_of_day is rejected"""
        response = client.post(
            "/symptoms/log",
            json={"description": "Headache", "time_of_day": "midnight"}
        )
        assert response.status_code == 422
        print("✅ test_invalid_time_of_day passed")

    @patch("routers.symptoms.supabase")
    def test_valid_time_of_day_values(self, mock_supabase):
        """Test all valid time_of_day values are accepted"""
        mock_supabase.table.return_value.insert.return_value.execute = mock_symptom_insert

        for time in ["morning", "afternoon", "evening", "night"]:
            response = client.post(
                "/symptoms/log",
                json={"description": "Headache", "time_of_day": time}
            )
            assert response.status_code == 200, f"Failed for time_of_day: {time}"
        print("✅ test_valid_time_of_day_values passed")

    @patch("routers.symptoms.supabase")
    def test_description_too_short(self, mock_supabase):
        """Test that description under 3 characters is rejected"""
        response = client.post(
            "/symptoms/log",
            json={"description": "ab"}
        )
        assert response.status_code == 422
        print("✅ test_description_too_short passed")

    @patch("routers.symptoms.supabase")
    def test_description_too_long(self, mock_supabase):
        """Test that description over 500 characters is rejected"""
        response = client.post(
            "/symptoms/log",
            json={"description": "a" * 501}
        )
        assert response.status_code == 422
        print("✅ test_description_too_long passed")

    @patch("routers.symptoms.supabase")
    def test_invalid_trigger_type(self, mock_supabase):
        """Test that invalid trigger type is rejected"""
        response = client.post(
            "/symptoms/log",
            json={
                "description": "Headache",
                "triggers": [
                    {"trigger_type": "invalid_type", "trigger_value": "test"}
                ]
            }
        )
        assert response.status_code == 422
        print("✅ test_invalid_trigger_type passed")
        