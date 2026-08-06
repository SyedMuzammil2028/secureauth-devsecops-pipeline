from datetime import datetime, timezone

from backend.common.config import settings
from backend.common.helpers import utc_now, utc_now_str, future_time_str
from backend.database.db import get_db
from backend.socket_server.crypto_utils import (
    hash_password,
    verify_password,
    generate_session_token,
    generate_temp_token,
)
from backend.socket_server.mfa_service import generate_mfa_secret


def _parse_time(value: str | None):
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError:
        return None


def get_admin_by_username(username: str):
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM admin_users WHERE username = ?",
            (username,),
        ).fetchone()


def get_admin_by_id(admin_id: int):
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM admin_users WHERE id = ?",
            (admin_id,),
        ).fetchone()


def create_default_admin(username: str, password: str):
    existing = get_admin_by_username(username)
    if existing:
        return False, "Admin already exists."

    mfa_secret = generate_mfa_secret()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO admin_users (
                username, password_hash, mfa_secret, mfa_enabled,
                failed_attempts, lock_until, created_at, updated_at
            )
            VALUES (?, ?, ?, 1, 0, NULL, ?, ?)
            """,
            (
                username,
                hash_password(password),
                mfa_secret,
                utc_now_str(),
                utc_now_str(),
            ),
        )

    return True, "Default admin created."


def is_admin_locked(admin_id: int):
    with get_db() as conn:
        row = conn.execute(
            "SELECT lock_until FROM admin_users WHERE id = ?",
            (admin_id,),
        ).fetchone()

        if not row or not row["lock_until"]:
            return False, None

        lock_until = _parse_time(row["lock_until"])
        if not lock_until:
            return False, None

        if utc_now() < lock_until:
            return True, row["lock_until"]

        conn.execute(
            """
            UPDATE admin_users
            SET lock_until = NULL, failed_attempts = 0, updated_at = ?
            WHERE id = ?
            """,
            (utc_now_str(), admin_id),
        )

    return False, None


def record_admin_failed_attempt(admin_id: int):
    with get_db() as conn:
        row = conn.execute(
            "SELECT failed_attempts FROM admin_users WHERE id = ?",
            (admin_id,),
        ).fetchone()

        failed_attempts = (row["failed_attempts"] or 0) + 1
        should_lock = failed_attempts >= settings.MAX_FAILED_ATTEMPTS

        if should_lock:
            conn.execute(
                """
                UPDATE admin_users
                SET failed_attempts = ?, lock_until = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    failed_attempts,
                    future_time_str(minutes=settings.LOCKOUT_MINUTES),
                    utc_now_str(),
                    admin_id,
                ),
            )
        else:
            conn.execute(
                """
                UPDATE admin_users
                SET failed_attempts = ?, updated_at = ?
                WHERE id = ?
                """,
                (failed_attempts, utc_now_str(), admin_id),
            )

    return should_lock, failed_attempts


def reset_admin_failed_attempts(admin_id: int):
    with get_db() as conn:
        conn.execute(
            """
            UPDATE admin_users
            SET failed_attempts = 0, lock_until = NULL, updated_at = ?
            WHERE id = ?
            """,
            (utc_now_str(), admin_id),
        )


def verify_admin_credentials(username: str, password: str):
    admin = get_admin_by_username(username)
    if not admin:
        return False, "Admin not found.", None

    locked, lock_until = is_admin_locked(admin["id"])
    if locked:
        return False, f"Admin account is locked until {lock_until}.", None

    if not verify_password(password, admin["password_hash"]):
        should_lock, _ = record_admin_failed_attempt(admin["id"])
        if should_lock:
            return False, "Admin account locked due to too many failed attempts.", None
        return False, "Invalid admin password.", None

    reset_admin_failed_attempts(admin["id"])
    return True, "Admin authenticated.", admin


def revoke_all_admin_sessions(admin_id: int) -> None:
    with get_db() as conn:
        conn.execute(
            """
            UPDATE admin_sessions
            SET is_revoked = 1
            WHERE admin_id = ?
            """,
            (admin_id,),
        )


def create_admin_mfa_temp(admin_id: int) -> str:
    temp_token = generate_temp_token()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO admin_mfa_temp (admin_id, temp_token, expires_at, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                admin_id,
                temp_token,
                future_time_str(minutes=5),
                utc_now_str(),
            ),
        )

    return temp_token


def get_admin_mfa_temp(temp_token: str):
    with get_db() as conn:
        return conn.execute(
            """
            SELECT * FROM admin_mfa_temp
            WHERE temp_token = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (temp_token,),
        ).fetchone()


def clear_admin_mfa_temp(temp_token: str) -> None:
    with get_db() as conn:
        conn.execute(
            "DELETE FROM admin_mfa_temp WHERE temp_token = ?",
            (temp_token,),
        )


def create_admin_session(admin_id: int) -> str:
    revoke_all_admin_sessions(admin_id)
    token = generate_session_token()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO admin_sessions (admin_id, session_token, issued_at, expires_at, is_revoked)
            VALUES (?, ?, ?, ?, 0)
            """,
            (
                admin_id,
                token,
                utc_now_str(),
                future_time_str(hours=12),
            ),
        )

    return token


def get_admin_session(session_token: str):
    with get_db() as conn:
        session = conn.execute(
            """
            SELECT * FROM admin_sessions
            WHERE session_token = ? AND is_revoked = 0
            """,
            (session_token,),
        ).fetchone()

        if not session:
            return None

        parsed = _parse_time(session["expires_at"])
        if not parsed or datetime.now(timezone.utc) > parsed:
            conn.execute(
                """
                UPDATE admin_sessions
                SET is_revoked = 1
                WHERE session_token = ?
                """,
                (session_token,),
            )
            return None

        return session


def revoke_admin_session(session_token: str) -> bool:
    with get_db() as conn:
        cursor = conn.execute(
            """
            UPDATE admin_sessions
            SET is_revoked = 1
            WHERE session_token = ?
            """,
            (session_token,),
        )
        return cursor.rowcount > 0