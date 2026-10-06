from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional
from supabase import create_client
from dotenv import load_dotenv
from services.auth_service import verify_token
from services.rate_limiter import limiter
from services.logger import get_logger
import os

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger("auth")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


class SignUpRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255, description="User email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")
    name: Optional[str] = Field(None, description="User full name")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255, description="User email address")
    password: str = Field(..., min_length=1)



class AuthResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    message: str = "Success"


@router.post("/signup", response_model=AuthResponse)
@limiter.limit("10/hour")
async def signup(request: Request, body: SignUpRequest):
    """
    Sign up a new user via Supabase Auth and return an access token.
    """
    try:
        credentials = {
            "email": body.email,
            "password": body.password,
        }
        if body.name:
            credentials["options"] = {"data": {"name": body.name}}

        res = supabase.auth.sign_up(credentials)

        access_token = res.session.access_token if res.session else None
        user_id = str(res.user.id) if res.user else None
        user_name = res.user.user_metadata.get("name") if res.user and res.user.user_metadata else body.name

        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user_id,
            email=body.email,
            name=user_name,
            message="User signed up successfully. " + ("" if access_token else "Please verify your email if confirmation is enabled.")
        )
    except Exception as e:
        logger.error(f"Sign up failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
@limiter.limit("20/hour")
async def login(request: Request, body: LoginRequest):
    """
    Sign in with email and password to retrieve a JWT access token for Swagger UI & API testing.
    """
    try:
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })

        if not res.session or not res.session.access_token:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user_name = res.user.user_metadata.get("name") if res.user and res.user.user_metadata else None

        return AuthResponse(
            access_token=res.session.access_token,
            token_type="bearer",
            user_id=str(res.user.id),
            email=res.user.email,
            name=user_name,
            message="Logged in successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid login credentials or unverified email")


@router.get("/me")
async def get_current_user_profile(user_id: str = Depends(verify_token)):
    """
    Returns the authenticated user's ID to verify that your Bearer token is working properly.
    """
    return {
        "authenticated": True,
        "user_id": user_id
    }
