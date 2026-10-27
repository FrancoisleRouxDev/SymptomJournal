from jose import jwt
from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import MovingWindowRateLimiter
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def get_client_ip(request: Request) -> str:
    """
    Best-effort client IP behind Render's proxy.
    Cloudflare-set headers come first because the edge overwrites them;
    X-Forwarded-For is a fallback only, since Render appends to a
    client-supplied value and the first hop can be spoofed.
    """
    for header in ("CF-Connecting-IP", "True-Client-IP"):
        ip = request.headers.get(header)
        if ip:
            return ip.strip()
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


def get_user_or_ip(request: Request) -> str:
    """
    Rate limit authenticated requests per user (the token's 'sub' claim),
    so refreshing a session doesn't reset the counter. Reading the claim
    unverified is safe here: slowapi only counts a request after the
    verify_token dependency has accepted it, so forged tokens never touch
    another user's counter. Falls back to the client IP otherwise.
    """
    auth: str = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            sub = jwt.get_unverified_claims(auth[7:]).get("sub")
            if sub:
                return f"user:{sub}"
        except Exception:
            pass
    return f"ip:{get_client_ip(request)}"


def auth_global_key(request: Request) -> str:
    """Single shared bucket — caps total auth attempts no matter how many IPs are used."""
    return "auth-global"


limiter = Limiter(key_func=get_user_or_ip, strategy="moving-window")


# ── Per-account login lockout ─────────────────────────────────
# Counts failed logins per email, so brute-forcing one account is capped
# even when attempts are spread across many (or spoofed) IPs.
LOGIN_FAILURE_LIMIT = parse("5/15minutes")
_login_failures = MovingWindowRateLimiter(MemoryStorage())


def is_login_locked(email: str) -> bool:
    return not _login_failures.test(LOGIN_FAILURE_LIMIT, "login-fail", email.lower())


def record_login_failure(email: str) -> None:
    _login_failures.hit(LOGIN_FAILURE_LIMIT, "login-fail", email.lower())


def clear_login_failures(email: str) -> None:
    _login_failures.clear(LOGIN_FAILURE_LIMIT, "login-fail", email.lower())
