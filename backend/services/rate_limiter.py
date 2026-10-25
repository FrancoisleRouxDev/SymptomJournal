from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def get_user_or_ip(request: Request) -> str:
    """Use the JWT user ID as the rate limit key so each user has their own
    independent counter. Falls back to IP if no auth header is present
    (e.g. unauthenticated endpoints like /ping).
    Fixes the Render proxy issue where all requests share the same IP."""
    auth: str = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        # Use the raw token as a unique-per-user key (avoids decoding overhead)
        return auth[7:]
    return get_remote_address(request)


limiter = Limiter(key_func=get_user_or_ip)
