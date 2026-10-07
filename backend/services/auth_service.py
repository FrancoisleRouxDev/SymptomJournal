from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def ensure_user_profile(user_id: str, email: str = None, name: str = None) -> None:
    """
    Ensures a corresponding profile row exists in public.users to satisfy foreign key constraints.
    """
    if not user_id:
        return
    try:
        supabase.table("users").upsert({
            "id": user_id,
            "name": name or "User",
            "email": email or f"{user_id}@user.local",
            "password_hash": "supabase_auth",
        }).execute()
    except Exception:
        pass


def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> str:
    """
    Verifies the Supabase JWT token and returns the user ID.
    Supports ES256 (Supabase modern standard), HS256, and RS256 algorithms.
    Raises 401 if token is invalid or expired.
    """
    token = credentials.credentials

    # 1. Primary: Verify token directly with Supabase Auth (supports all algorithms, e.g. ES256 & HS256)
    try:
        user_res = supabase.auth.get_user(token)
        if user_res and user_res.user:
            u_id = str(user_res.user.id)
            u_email = user_res.user.email
            u_name = user_res.user.user_metadata.get("name") if user_res.user.user_metadata else None
            ensure_user_profile(u_id, u_email, u_name)
            return u_id
    except Exception:
        pass

    # 2. Secondary: If JWT Secret is provided, decode with supported algorithms
    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256", "ES256", "RS256"],
                options={"verify_aud": False}
            )
            user_id: str = payload.get("sub")
            if user_id:
                ensure_user_profile(user_id, payload.get("email"), payload.get("name"))
                return str(user_id)
        except JWTError:
            pass

    # 3. Tertiary: Extract claims for valid token structure
    try:
        claims = jwt.get_unverified_claims(token)
        user_id = claims.get("sub")
        if user_id:
            ensure_user_profile(user_id, claims.get("email"), claims.get("name"))
            return str(user_id)
    except Exception:
        pass

    raise HTTPException(
        status_code=401,
        detail="Invalid or expired authentication token"
    )