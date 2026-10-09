import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


def test_login_validation_error():
    """Test POST /auth/login returns 422 on empty body or invalid email"""
    response = client.post("/auth/login", json={"email": "invalid-email", "password": ""})
    assert response.status_code == 422


def test_signup_validation_error():
    """Test POST /auth/signup validates password length"""
    response = client.post("/auth/signup", json={"email": "test@example.com", "password": "123"})
    assert response.status_code == 422


@patch("routers.auth.supabase")
def test_signup_success(mock_supabase):
    """Test POST /auth/signup calls Supabase auth.sign_up"""
    mock_res = MagicMock()
    mock_res.session.access_token = "mock-jwt-token"
    mock_res.user.id = "550e8400-e29b-41d4-a716-446655440000"
    mock_res.user.user_metadata = {"name": "Test User"}
    mock_supabase.auth.sign_up.return_value = mock_res

    response = client.post(
        "/auth/signup",
        json={"email": "user@example.com", "password": "password123", "name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "mock-jwt-token"
    assert data["email"] == "user@example.com"
    assert data["name"] == "Test User"


@patch("routers.auth.supabase")
def test_login_success(mock_supabase):
    """Test POST /auth/login calls Supabase auth.sign_in_with_password"""
    mock_res = MagicMock()
    mock_res.session.access_token = "mock-jwt-token"
    mock_res.user.id = "550e8400-e29b-41d4-a716-446655440000"
    mock_res.user.email = "user@example.com"
    mock_res.user.user_metadata = {"name": "Test User"}
    mock_supabase.auth.sign_in_with_password.return_value = mock_res

    response = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "mock-jwt-token"
    assert data["user_id"] == "550e8400-e29b-41d4-a716-446655440000"
