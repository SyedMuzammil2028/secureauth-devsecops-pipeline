# Project configuration placeholder
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    APP_NAME = "Secure Auth System"

    SOCKET_HOST = os.getenv("SOCKET_HOST", "127.0.0.1")
    SOCKET_PORT = int(os.getenv("SOCKET_PORT", "9000"))

    API_HOST = os.getenv("API_HOST", "127.0.0.1")
    API_PORT = int(os.getenv("API_PORT", "8000"))

    DB_PATH = os.getenv("DB_PATH", str(BASE_DIR / "backend" / "database" / "auth_system.db"))

    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_TIMEOUT_SECONDS = int(os.getenv("SMTP_TIMEOUT_SECONDS", "10"))

    EMAIL_OTP_EXPIRY_MINUTES = int(os.getenv("EMAIL_OTP_EXPIRY_MINUTES", "5"))
    MFA_TEMP_EXPIRY_MINUTES = int(os.getenv("MFA_TEMP_EXPIRY_MINUTES", "5"))
    NONCE_EXPIRY_MINUTES = int(os.getenv("NONCE_EXPIRY_MINUTES", "2"))
    SESSION_EXPIRY_HOURS = int(os.getenv("SESSION_EXPIRY_HOURS", "12"))

    MAX_FAILED_ATTEMPTS = int(os.getenv("MAX_FAILED_ATTEMPTS", "5"))
    LOCKOUT_MINUTES = int(os.getenv("LOCKOUT_MINUTES", "10"))

    RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "10"))

    HMAC_SECRET_FALLBACK = os.getenv("HMAC_SECRET_FALLBACK", "change-this-in-env")


settings = Settings()

