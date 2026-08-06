from datetime import datetime, timezone

from backend.common.config import settings
from backend.common.helpers import future_time_str, utc_now_str
from backend.database.db import get_db
from backend.socket_server.crypto_utils import generate_session_token


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


def _is_expired(value: str | None) -> bool:
    parsed = _parse_time(value)

    if not parsed:
        return True

    return datetime.now(timezone.utc) > parsed


def create_session(
    user_id: int,
    login_identifier: str,
    ip_address: str | None = None,
) -> str:
    session_token = generate_session_token()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO sessions (
                user_id,
                session_token,
                login_identifier,
                ip_address,
                issued_at,
                expires_at,
                is_revoked
            )
            VALUES (?, ?, ?, ?, ?, ?, 0)
            """,
            (
                user_id,
                session_token,
                login_identifier,
                ip_address,
                utc_now_str(),
                future_time_str(hours=settings.SESSION_EXPIRY_HOURS),
            ),
        )

    return session_token


def get_session(session_token: str):
    with get_db() as conn:
        session = conn.execute(
            """
            SELECT *
            FROM sessions
            WHERE session_token = ?
              AND is_revoked = 0
            """,
            (session_token,),
        ).fetchone()

        if not session:
            return None

        if _is_expired(session["expires_at"]):
            conn.execute(
                """
                UPDATE sessions
                SET is_revoked = 1
                WHERE session_token = ?
                """,
                (session_token,),
            )
            return None

        return session


def revoke_session(session_token: str) -> bool:
    with get_db() as conn:
        cursor = conn.execute(
            """
            UPDATE sessions
            SET is_revoked = 1
            WHERE session_token = ?
            """,
            (session_token,),
        )

        return cursor.rowcount > 0


def revoke_all_user_sessions(user_id: int) -> None:
    with get_db() as conn:
        conn.execute(
            """
            UPDATE sessions
            SET is_revoked = 1
            WHERE user_id = ?
            """,
            (user_id,),
        )