from backend.database.db import get_db
from backend.common.helpers import utc_now_str


def log_event(
    event_type: str,
    status: str,
    username: str | None = None,
    user_id: int | None = None,
    ip_address: str | None = None,
    details: str | None = None,
) -> None:
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO audit_logs (user_id, username, event_type, status, ip_address, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, username, event_type, status, ip_address, details, utc_now_str()),
        )