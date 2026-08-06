from backend.database.db import get_db
from backend.socket_server.session_service import get_session
from backend.socket_server.email_service import (
    create_and_send_email_otp,
    verify_email_otp,
    send_email,
)
from backend.socket_server.mfa_service import verify_totp_code
from backend.common.constants import EMAIL_VERIFICATION_PURPOSES
from backend.common.helpers import utc_now_str
from backend.socket_server.logger_service import log_event


def get_current_user_by_session(session_token: str):
    session = get_session(session_token)
    if not session:
        return None, "Invalid session token."

    with get_db() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (session["user_id"],),
        ).fetchone()

    if not user:
        return None, "User not found."

    if user["is_deleted"]:
        return None, "This account has been deleted."

    if user["is_suspended"]:
        return None, user["suspension_reason"] or "This account is suspended."

    return {"user": user, "session": session}, None


def get_user_profile(session_token: str):
    result, error = get_current_user_by_session(session_token)
    if error:
        return None, error

    user = result["user"]
    session = result["session"]

    return {
        "id": user["id"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "username": user["username"],
        "email": user["email"],
        "date_of_birth": user["date_of_birth"],
        "gender": user["gender"],
        "nationality": user["nationality"],
        "country_code": user["country_code"],
        "phone_number": user["phone_number"],
        "is_email_verified": bool(user["is_email_verified"]),
        "mfa_enabled": bool(user["mfa_enabled"]),
        "session": {
            "session_token": session["session_token"],
            "login_identifier": session["login_identifier"],
            "ip_address": session["ip_address"],
            "issued_at": session["issued_at"],
            "expires_at": session["expires_at"],
        },
    }, None


def start_email_change(session_token: str, new_email: str):
    result, error = get_current_user_by_session(session_token)
    if error:
        return False, error

    user = result["user"]

    if new_email.strip().lower() == user["email"].strip().lower():
        return False, "New email must be different from current email."

    with get_db() as conn:
        existing_user = conn.execute(
            """
            SELECT id FROM users
            WHERE email = ? AND is_deleted = 0
            """,
            (new_email,),
        ).fetchone()

    if existing_user:
        return False, "This email is already in use."

    ok, message = create_and_send_email_otp(
        email=new_email,
        purpose=EMAIL_VERIFICATION_PURPOSES["CHANGE_EMAIL"],
        username=user["username"],
    )

    if ok:
        log_event(
            event_type="email_change_otp_sent",
            status="success",
            username=user["username"],
            user_id=user["id"],
            ip_address=result["session"]["ip_address"],
            details=f"OTP sent for email change to {new_email}.",
        )

    return ok, message


def verify_email_change(session_token: str, new_email: str, otp_code: str):
    result, error = get_current_user_by_session(session_token)
    if error:
        return False, error

    user = result["user"]
    session = result["session"]

    verified, verify_result = verify_email_otp(
        email=new_email,
        otp_code=otp_code,
        purpose=EMAIL_VERIFICATION_PURPOSES["CHANGE_EMAIL"],
    )

    if not verified:
        log_event(
            event_type="email_change_otp_fail",
            status="error",
            username=user["username"],
            user_id=user["id"],
            ip_address=session["ip_address"],
            details=str(verify_result),
        )
        return False, str(verify_result)

    with get_db() as conn:
        conn.execute(
            """
            UPDATE users
            SET email = ?, updated_at = ?
            WHERE id = ?
            """,
            (new_email, utc_now_str(), user["id"]),
        )

    log_event(
        event_type="email_change_success",
        status="success",
        username=user["username"],
        user_id=user["id"],
        ip_address=session["ip_address"],
        details=f"Email updated to {new_email}.",
    )

    return True, "Email updated successfully."


def get_user_sessions(session_token: str):
    result, error = get_current_user_by_session(session_token)
    if error:
        return None, error

    user = result["user"]

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM sessions
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user["id"],),
        ).fetchall()

    sessions = []
    for row in rows:
        sessions.append({
            "id": row["id"],
            "session_token": row["session_token"],
            "login_identifier": row["login_identifier"],
            "ip_address": row["ip_address"],
            "issued_at": row["issued_at"],
            "expires_at": row["expires_at"],
            "is_revoked": bool(row["is_revoked"]),
        })

    return sessions, None


def delete_own_account(session_token: str, otp: str, reason: str):
    result, error = get_current_user_by_session(session_token)
    if error:
        return False, error

    user = result["user"]
    session = result["session"]

    if not user["mfa_secret"]:
        return False, "MFA secret not found. Account deletion requires MFA verification."

    if not verify_totp_code(user["mfa_secret"], otp):
        log_event(
            event_type="account_delete_mfa_fail",
            status="error",
            username=user["username"],
            user_id=user["id"],
            ip_address=session["ip_address"],
            details="Invalid MFA OTP during account deletion.",
        )
        return False, "Invalid MFA OTP code."

    with get_db() as conn:
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
                user["id"],
            ),
        )

        conn.execute(
            """
            UPDATE sessions
            SET is_revoked = 1
            WHERE user_id = ?
            """,
            (user["id"],),
        )

    log_event(
        event_type="account_deleted_by_user",
        status="success",
        username=user["username"],
        user_id=user["id"],
        ip_address=session["ip_address"],
        details=reason,
    )

    send_email(
        subject="SecureAuth account deletion confirmation",
        recipient=user["email"],
        body=(
            f"Hello {user['username']},\n\n"
            "Your SecureAuth account has been deleted after MFA verification.\n"
            "If you did not perform this action, contact the system administrator immediately.\n\n"
            "SecureAuth"
        ),
    )

    return True, "Account deleted successfully. A confirmation email has been sent."