# lockout_service placeholder
from datetime import datetime
from backend.common.config import settings
from backend.common.helpers import utc_now, future_time_str
from backend.database.db import get_db


def is_account_locked(user_id: int) -> tuple[bool, str | None]:
    with get_db() as conn:
        row = conn.execute(
            "SELECT lock_until FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

        if not row or not row["lock_until"]:
            return False, None

        lock_until = datetime.fromisoformat(row["lock_until"])
        if utc_now() < lock_until:
            return True, row["lock_until"]

        conn.execute(
            "UPDATE users SET lock_until = NULL, failed_attempts = 0, updated_at = ? WHERE id = ?",
            (utc_now().isoformat(), user_id),
        )
        return False, None


def record_failed_attempt(user_id: int) -> tuple[bool, int]:
    with get_db() as conn:
        row = conn.execute(
            "SELECT failed_attempts FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

        failed_attempts = (row["failed_attempts"] or 0) + 1
        should_lock = failed_attempts >= settings.MAX_FAILED_ATTEMPTS

        if should_lock:
            conn.execute(
                """
                UPDATE users
                SET failed_attempts = ?, lock_until = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    failed_attempts,
                    future_time_str(minutes=settings.LOCKOUT_MINUTES),
                    utc_now().isoformat(),
                    user_id,
                ),
            )
        else:
            conn.execute(
                """
                UPDATE users
                SET failed_attempts = ?, updated_at = ?
                WHERE id = ?
                """,
                (failed_attempts, utc_now().isoformat(), user_id),
            )

    return should_lock, failed_attempts


def reset_failed_attempts(user_id: int) -> None:
    with get_db() as conn:
        conn.execute(
            """
            UPDATE users
            SET failed_attempts = 0, lock_until = NULL, updated_at = ?
            WHERE id = ?
            """,
            (utc_now().isoformat(), user_id),
        )
        
