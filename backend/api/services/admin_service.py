from backend.common.helpers import utc_now_str, future_time_str, validate_username, password_strength
from backend.database.db import get_db
from backend.socket_server.crypto_utils import hash_password, verify_password
from backend.socket_server.session_service import revoke_session
from backend.socket_server.admin_service import get_admin_session


def require_admin(admin_session_token: str):
    session = get_admin_session(admin_session_token)
    if not session:
        return None, "Invalid admin session."

    with get_db() as conn:
        admin = conn.execute(
            "SELECT * FROM admin_users WHERE id = ?",
            (session["admin_id"],),
        ).fetchone()

    if not admin:
        return None, "Admin not found."

    return {"admin": admin, "session": session}, None


def get_dashboard_stats(admin_session_token: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return None, error

    with get_db() as conn:
        total_users = conn.execute(
            "SELECT COUNT(*) AS count FROM users WHERE is_deleted = 0"
        ).fetchone()["count"]

        verified_emails = conn.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            WHERE is_email_verified = 1 AND is_deleted = 0
            """
        ).fetchone()["count"]

        active_sessions = conn.execute(
            "SELECT COUNT(*) AS count FROM sessions WHERE is_revoked = 0"
        ).fetchone()["count"]

        locked_accounts = conn.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            WHERE lock_until IS NOT NULL AND is_deleted = 0
            """
        ).fetchone()["count"]

        recent_mfa = conn.execute(
            "SELECT COUNT(*) AS count FROM audit_logs WHERE event_type = 'mfa_success'"
        ).fetchone()["count"]

    return {
        "total_users": total_users,
        "verified_emails": verified_emails,
        "active_sessions": active_sessions,
        "locked_accounts": locked_accounts,
        "recent_mfa_success_count": recent_mfa,
    }, None


def get_all_users(admin_session_token: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return None, error

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT id, first_name, last_name, username, email,
                   is_email_verified, mfa_enabled, failed_attempts,
                   lock_until, is_suspended, suspension_reason,
                   is_deleted, deletion_reason, deleted_at, created_at
            FROM users
            ORDER BY id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows], None


def get_all_logs(admin_session_token: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return None, error

    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM audit_logs ORDER BY id DESC"
        ).fetchall()

    return [dict(row) for row in rows], None


def get_locked_accounts(admin_session_token: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return None, error

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT id, username, email, failed_attempts, lock_until
            FROM users
            WHERE lock_until IS NOT NULL AND is_deleted = 0
            ORDER BY id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows], None


def unlock_user(admin_session_token: str, user_id: int):
    auth, error = require_admin(admin_session_token)
    if error:
        return False, error

    with get_db() as conn:
        cursor = conn.execute(
            """
            UPDATE users
            SET failed_attempts = 0,
                lock_until = NULL,
                updated_at = ?
            WHERE id = ?
            """,
            (utc_now_str(), user_id),
        )

    if cursor.rowcount <= 0:
        return False, "User not found or already unlocked."

    return True, "User unlocked successfully."


def lock_user(admin_session_token: str, user_id: int, lock_minutes: int, reason: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return False, error

    if lock_minutes < 1:
        lock_minutes = 10

    with get_db() as conn:
        cursor = conn.execute(
            """
            UPDATE users
            SET failed_attempts = failed_attempts + 1,
                lock_until = ?,
                updated_at = ?
            WHERE id = ? AND is_deleted = 0
            """,
            (
                future_time_str(minutes=lock_minutes),
                utc_now_str(),
                user_id,
            ),
        )

        user = conn.execute(
            "SELECT username FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

        if user:
            conn.execute(
                """
                INSERT INTO audit_logs (
                    user_id, username, event_type, status,
                    ip_address, details, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    user["username"],
                    "admin_user_locked",
                    "success",
                    None,
                    reason,
                    utc_now_str(),
                ),
            )

    if cursor.rowcount <= 0:
        return False, "User not found or deleted."

    return True, "User locked successfully."


def suspend_user(admin_session_token: str, user_id: int, is_suspended: bool, reason: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return False, error

    with get_db() as conn:
        cursor = conn.execute(
            """
            UPDATE users
            SET is_suspended = ?,
                suspension_reason = ?,
                updated_at = ?
            WHERE id = ? AND is_deleted = 0
            """,
            (
                1 if is_suspended else 0,
                reason if is_suspended else None,
                utc_now_str(),
                user_id,
            ),
        )

        user = conn.execute(
            "SELECT username FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

        if user:
            conn.execute(
                """
                INSERT INTO audit_logs (
                    user_id, username, event_type, status,
                    ip_address, details, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    user["username"],
                    "admin_user_suspended" if is_suspended else "admin_user_unsuspended",
                    "success",
                    None,
                    reason,
                    utc_now_str(),
                ),
            )

    if cursor.rowcount <= 0:
        return False, "User not found or deleted."

    return True, "User suspended successfully." if is_suspended else "User reactivated successfully."


def soft_delete_user(admin_session_token: str, user_id: int, reason: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return False, error

    with get_db() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

        if not user:
            return False, "User not found."

        if user["is_deleted"]:
            return False, "User is already deleted."

        conn.execute(
            """
            UPDATE users
            SET is_deleted = 1,
                deletion_reason = ?,
                deleted_at = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                reason,
                utc_now_str(),
                utc_now_str(),
                user_id,
            ),
        )

        conn.execute(
            """
            UPDATE sessions
            SET is_revoked = 1
            WHERE user_id = ?
            """,
            (user_id,),
        )

        conn.execute(
            """
            INSERT INTO audit_logs (
                user_id, username, event_type, status,
                ip_address, details, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                user["username"],
                "admin_user_deleted",
                "success",
                None,
                reason,
                utc_now_str(),
            ),
        )

    return True, "User soft deleted successfully."


def get_all_sessions(admin_session_token: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return None, error

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT s.*, u.username, u.email
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows], None


def revoke_user_session(admin_session_token: str, session_token: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return False, error

    success = revoke_session(session_token)
    if not success:
        return False, "Session not found or already revoked."

    return True, "Session revoked successfully."


def change_admin_password(admin_session_token: str, current_password: str, new_password: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return False, error

    admin = auth["admin"]

    if not verify_password(current_password, admin["password_hash"]):
        return False, "Current password is incorrect."

    strong, errors = password_strength(new_password)
    if not strong:
        return False, "; ".join(errors)

    with get_db() as conn:
        conn.execute(
            """
            UPDATE admin_users
            SET password_hash = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                hash_password(new_password),
                utc_now_str(),
                admin["id"],
            ),
        )

        conn.execute(
            """
            UPDATE admin_sessions
            SET is_revoked = 1
            WHERE admin_id = ? AND session_token != ?
            """,
            (
                admin["id"],
                admin_session_token,
            ),
        )

    return True, "Admin password changed successfully."


def update_admin_profile(admin_session_token: str, username: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return False, error

    admin = auth["admin"]
    username = username.strip()

    if not validate_username(username):
        return False, "Username must be 4–20 characters and contain only letters, numbers, or underscore."

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM admin_users WHERE username = ? AND id != ?",
            (
                username,
                admin["id"],
            ),
        ).fetchone()

        if existing:
            return False, "Admin username is already taken."

        conn.execute(
            """
            UPDATE admin_users
            SET username = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                username,
                utc_now_str(),
                admin["id"],
            ),
        )

    return True, "Admin profile updated successfully."

def clear_audit_logs(admin_session_token: str):
    auth, error = require_admin(admin_session_token)
    if error:
        return False, error

    admin = auth["admin"]

    with get_db() as conn:
        deleted_count = conn.execute(
            "SELECT COUNT(*) AS count FROM audit_logs"
        ).fetchone()["count"]

        conn.execute("DELETE FROM audit_logs")

        conn.execute(
            """
            INSERT INTO audit_logs (
                user_id, username, event_type, status,
                ip_address, details, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                None,
                admin["username"],
                "audit_logs_cleared",
                "success",
                None,
                f"Admin cleared {deleted_count} audit log records.",
                utc_now_str(),
            ),
        )

    return True, f"Audit logs cleared successfully. Removed {deleted_count} records."