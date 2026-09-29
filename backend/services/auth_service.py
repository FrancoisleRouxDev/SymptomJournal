from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
import os

load_dotenv()

security = HTTPBearer()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> str:
    """
    Verifies the Supabase JWT token and returns the user ID.
    Raises 401 if token is invalid or expired.
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )

        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token — no user ID found"
            )

        return user_id

    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired token: {str(e)}"
        )