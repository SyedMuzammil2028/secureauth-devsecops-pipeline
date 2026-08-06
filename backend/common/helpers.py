# Shared helpers placeholder
import re
import secrets
import string
from datetime import datetime, timedelta, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_now_str() -> str:
    return utc_now().isoformat()


def future_time_str(minutes: int = 0, hours: int = 0) -> str:
    return (utc_now() + timedelta(minutes=minutes, hours=hours)).isoformat()


def generate_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)


def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))


def validate_username(username: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9_]{4,20}", username or ""))


def validate_email(email: str) -> bool:
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email or ""))


def password_strength(password: str) -> tuple[bool, list[str]]:
    errors = []

    if len(password or "") < 8:
        errors.append("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password or ""):
        errors.append("Password must include at least one uppercase letter.")
    if not re.search(r"[a-z]", password or ""):
        errors.append("Password must include at least one lowercase letter.")
    if not re.search(r"\d", password or ""):
        errors.append("Password must include at least one digit.")
    if not re.search(r"[^\w\s]", password or ""):
        errors.append("Password must include at least one special character.")

    return (len(errors) == 0, errors)