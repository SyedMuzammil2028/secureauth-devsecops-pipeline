import json
from datetime import datetime, timezone

from backend.common.constants import EMAIL_VERIFICATION_PURPOSES, EVENTS, STATUS
from backend.socket_server.protocol import make_response
from backend.socket_server.rate_limiter import rate_limiter
from backend.socket_server.logger_service import log_event
from backend.socket_server.auth_service import (
    start_registration,
    create_user_after_email_verification,
    verify_login_credentials,
    create_login_nonce,
    get_active_nonce,
    mark_nonce_used,
    get_user_by_identifier,
)
from backend.socket_server.email_service import verify_email_otp
from backend.socket_server.mfa_service import (
    create_temp_mfa_state,
    get_temp_mfa_state,
    clear_temp_mfa_state,
    generate_qr_base64,
    verify_totp_code,
)
from backend.socket_server.session_service import create_session, revoke_session
from backend.socket_server.crypto_utils import verify_hmac_response
from backend.socket_server.admin_service import (
    verify_admin_credentials,
    create_admin_mfa_temp,
    get_admin_mfa_temp,
    clear_admin_mfa_temp,
    create_admin_session,
    revoke_admin_session,
    get_admin_by_id,
    get_admin_by_username,
)


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    value = value.strip()
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        pass
    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _is_expired(expires_at: str | None) -> bool:
    parsed = _parse_datetime(expires_at)
    if not parsed:
        return True
    now = datetime.now(timezone.utc)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return now > parsed


def _required_fields(payload: dict, fields: list[str]) -> tuple[bool, str | None]:
    for field in fields:
        value = payload.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            return False, f"Missing required field: {field}"
    return True, None


def handle_register_start(payload: dict, client_ip: str) -> dict:
    allowed = rate_limiter.is_allowed(f"register_start:{client_ip}")
    if not allowed:
        log_event(EVENTS["RATE_LIMITED"], "blocked", username=payload.get("username"), ip_address=client_ip, details="Registration rate limit exceeded.")
        return make_response(STATUS["ERROR"], "Too many registration attempts. Try again later.")

    required = [
        "first_name",
        "last_name",
        "username",
        "email",
        "password",
        "date_of_birth",
        "gender",
        "nationality",
        "country_code",
        "phone_number",
    ]
    valid, error = _required_fields(payload, required)
    if not valid:
        return make_response(STATUS["ERROR"], error)

    success, message = start_registration(payload)

    if success:
        log_event(EVENTS["EMAIL_OTP_SENT"], "success", username=payload.get("username"), ip_address=client_ip, details=f"Registration OTP sent to {payload.get('email')}.")
        return make_response(STATUS["OTP_SENT"], message, email=payload.get("email"), next_step="verify_email_otp")

    log_event(EVENTS["REGISTER_FAIL"], "error", username=payload.get("username"), ip_address=client_ip, details=message)
    return make_response(STATUS["ERROR"], message)


def handle_verify_email_otp(payload: dict, client_ip: str) -> dict:
    required = [
        "first_name",
        "last_name",
        "username",
        "email",
        "password",
        "date_of_birth",
        "gender",
        "nationality",
        "country_code",
        "phone_number",
        "otp_code",
    ]
    valid, error = _required_fields(payload, required)
    if not valid:
        return make_response(STATUS["ERROR"], error)

    email = payload["email"].strip()
    otp_code = payload["otp_code"].strip()

    verified, result = verify_email_otp(email=email, otp_code=otp_code, purpose=EMAIL_VERIFICATION_PURPOSES["REGISTER"])

    if not verified:
        log_event(EVENTS["EMAIL_OTP_FAIL"], "error", username=payload.get("username"), ip_address=client_ip, details=str(result))
        return make_response(STATUS["ERROR"], str(result))

    created, message, user_id = create_user_after_email_verification(payload)

    if not created:
        log_event(EVENTS["REGISTER_FAIL"], "error", username=payload.get("username"), ip_address=client_ip, details=message)
        return make_response(STATUS["ERROR"], message)

    log_event(EVENTS["EMAIL_OTP_SUCCESS"], "success", username=payload.get("username"), user_id=user_id, ip_address=client_ip, details="Registration email verified successfully.")
    log_event(EVENTS["REGISTER_SUCCESS"], "success", username=payload.get("username"), user_id=user_id, ip_address=client_ip, details="User account created successfully.")

    return make_response(STATUS["EMAIL_VERIFIED"], "Email verified and account created successfully.", user_id=user_id, username=payload.get("username"), next_step="login_start")


def handle_login_start(payload: dict, client_ip: str) -> dict:
    required = ["login_identifier", "password"]
    valid, error = _required_fields(payload, required)
    if not valid:
        return make_response(STATUS["ERROR"], error)

    login_identifier = payload["login_identifier"].strip()
    password = payload["password"]

    allowed = rate_limiter.is_allowed(f"login_start:{client_ip}:{login_identifier}")
    if not allowed:
        log_event(EVENTS["RATE_LIMITED"], "blocked", username=login_identifier, ip_address=client_ip, details="Login rate limit exceeded.")
        return make_response(STATUS["ERROR"], "Too many login attempts. Try again later.")

    success, message, user = verify_login_credentials(login_identifier, password)

    if not success:
        log_event(EVENTS["LOGIN_FAIL"], "error", username=login_identifier, ip_address=client_ip, details=message)
        return make_response(STATUS["ERROR"], message)

    nonce = create_login_nonce(user["id"])

    log_event(EVENTS["LOGIN_START"], "success", username=user["username"], user_id=user["id"], ip_address=client_ip, details="Primary credentials accepted, nonce generated.")

    return make_response(STATUS["CHALLENGE_SENT"], "Challenge generated successfully.", nonce=nonce, login_identifier=login_identifier, next_step="login_verify")


def handle_login_verify(payload: dict, client_ip: str) -> dict:
    required = ["login_identifier", "password", "nonce", "hmac_response"]
    valid, error = _required_fields(payload, required)
    if not valid:
        return make_response(STATUS["ERROR"], error)

    login_identifier = payload["login_identifier"].strip()
    password = payload["password"]
    nonce_value = payload["nonce"].strip()
    received_hmac = payload["hmac_response"].strip()

    user = get_user_by_identifier(login_identifier)
    if not user:
        log_event(EVENTS["LOGIN_FAIL"], "error", username=login_identifier, ip_address=client_ip, details="User not found during login_verify.")
        return make_response(STATUS["ERROR"], "User not found.")

    nonce_row = get_active_nonce(user["id"], nonce_value)
    if not nonce_row:
        log_event(EVENTS["LOGIN_FAIL"], "error", username=user["username"], user_id=user["id"], ip_address=client_ip, details="Invalid or already-used nonce.")
        return make_response(STATUS["ERROR"], "Invalid or expired nonce.")

    if _is_expired(nonce_row["expires_at"]):
        mark_nonce_used(nonce_row["id"])
        log_event(EVENTS["LOGIN_FAIL"], "error", username=user["username"], user_id=user["id"], ip_address=client_ip, details="Nonce expired before verification.")
        return make_response(STATUS["ERROR"], "Nonce has expired.")

    is_valid_hmac = verify_hmac_response(password, nonce_value, received_hmac)
    if not is_valid_hmac:
        log_event(EVENTS["LOGIN_FAIL"], "error", username=user["username"], user_id=user["id"], ip_address=client_ip, details="Invalid HMAC response.")
        return make_response(STATUS["ERROR"], "Invalid challenge-response proof.")

    mark_nonce_used(nonce_row["id"])
    temp_token = create_temp_mfa_state(user["id"])

    log_event(EVENTS["LOGIN_SUCCESS"], "success", username=user["username"], user_id=user["id"], ip_address=client_ip, details="Challenge-response verified, MFA required.")

    return make_response(STATUS["MFA_REQUIRED"], "Primary authentication successful. Proceed to MFA verification.", temp_token=temp_token, next_step="generate_qr_access_or_mfa_verify")


def handle_generate_qr_access(payload: dict, client_ip: str) -> dict:
    valid, error = _required_fields(payload, ["temp_token"])
    if not valid:
        return make_response(STATUS["ERROR"], error)

    temp_token = payload["temp_token"].strip()
    temp_state = get_temp_mfa_state(temp_token)

    if not temp_state:
        return make_response(STATUS["ERROR"], "Invalid MFA temp token.")

    if _is_expired(temp_state["expires_at"]):
        clear_temp_mfa_state(temp_token)
        return make_response(STATUS["ERROR"], "MFA session expired.")

    from backend.database.db import get_db
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (temp_state["user_id"],)).fetchone()

    if not user:
        return make_response(STATUS["ERROR"], "User not found for MFA.")

    if not user["mfa_secret"]:
        return make_response(STATUS["ERROR"], "MFA is not configured for this user.")

    qr_base64 = generate_qr_base64(user["username"], user["mfa_secret"])

    return make_response(STATUS["QR_READY"], "QR code generated successfully.", qr_data=qr_base64, username=user["username"])


def handle_mfa_verify(payload: dict, client_ip: str) -> dict:
    valid, error = _required_fields(payload, ["temp_token", "otp"])
    if not valid:
        return make_response(STATUS["ERROR"], error)

    temp_token = payload["temp_token"].strip()
    otp = payload["otp"].strip()

    temp_state = get_temp_mfa_state(temp_token)
    if not temp_state:
        return make_response(STATUS["ERROR"], "Invalid MFA temp token.")

    if _is_expired(temp_state["expires_at"]):
        clear_temp_mfa_state(temp_token)
        return make_response(STATUS["ERROR"], "MFA session expired.")

    from backend.database.db import get_db
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (temp_state["user_id"],)).fetchone()

    if not user:
        clear_temp_mfa_state(temp_token)
        return make_response(STATUS["ERROR"], "User not found.")

    if not user["mfa_secret"]:
        return make_response(STATUS["ERROR"], "MFA secret not found.")

    if not verify_totp_code(user["mfa_secret"], otp):
        log_event(EVENTS["MFA_FAIL"], "error", username=user["username"], user_id=user["id"], ip_address=client_ip, details="Invalid OTP entered during MFA verification.")
        return make_response(STATUS["ERROR"], "Invalid MFA OTP code.")

    session_token = create_session(user_id=user["id"], login_identifier=user["username"], ip_address=client_ip)
    clear_temp_mfa_state(temp_token)

    log_event(EVENTS["MFA_SUCCESS"], "success", username=user["username"], user_id=user["id"], ip_address=client_ip, details="MFA verified successfully.")
    log_event(EVENTS["SESSION_CREATED"], "success", username=user["username"], user_id=user["id"], ip_address=client_ip, details="Session created after successful MFA.")

    return make_response(STATUS["SESSION_CREATED"], "Login successful.", session_token=session_token, username=user["username"], next_step="welcome_page")


def handle_logout(payload: dict, client_ip: str) -> dict:
    valid, error = _required_fields(payload, ["session_token"])
    if not valid:
        return make_response(STATUS["ERROR"], error)

    session_token = payload["session_token"].strip()
    success = revoke_session(session_token)

    if not success:
        return make_response(STATUS["ERROR"], "Invalid or already revoked session token.")

    log_event(EVENTS["LOGOUT"], "success", ip_address=client_ip, details="Session revoked successfully.")
    return make_response(STATUS["SUCCESS"], "Logged out successfully.")


def handle_admin_login_start(payload: dict, client_ip: str) -> dict:
    valid, error = _required_fields(payload, ["username", "password"])
    if not valid:
        return make_response(STATUS["ERROR"], error)

    username = payload["username"].strip()
    password = payload["password"]

    success, message, admin = verify_admin_credentials(username, password)
    if not success:
        log_event(EVENTS["ADMIN_LOGIN_FAIL"], "error", username=username, ip_address=client_ip, details=message)
        return make_response(STATUS["ERROR"], message)

    temp_token = create_admin_mfa_temp(admin["id"])

    log_event(EVENTS["ADMIN_LOGIN_SUCCESS"], "success", username=username, ip_address=client_ip, details="Admin primary credentials verified. MFA required.")

    return make_response(STATUS["MFA_REQUIRED"], "Admin primary authentication successful. Proceed to MFA verification.", temp_token=temp_token, next_step="admin_generate_qr_access_or_admin_mfa_verify")


def handle_admin_generate_qr_access(payload: dict, client_ip: str) -> dict:
    valid, error = _required_fields(payload, ["temp_token"])
    if not valid:
        return make_response(STATUS["ERROR"], error)

    temp_token = payload["temp_token"].strip()
    temp_state = get_admin_mfa_temp(temp_token)

    if not temp_state:
        return make_response(STATUS["ERROR"], "Invalid admin MFA temp token.")

    if _is_expired(temp_state["expires_at"]):
        clear_admin_mfa_temp(temp_token)
        return make_response(STATUS["ERROR"], "Admin MFA session expired.")

    admin = get_admin_by_id(temp_state["admin_id"])
    if not admin:
        return make_response(STATUS["ERROR"], "Admin not found.")

    if not admin["mfa_secret"]:
        return make_response(STATUS["ERROR"], "Admin MFA secret not found.")

    qr_base64 = generate_qr_base64(admin["username"], admin["mfa_secret"])

    return make_response(STATUS["QR_READY"], "Admin QR code generated successfully.", qr_data=qr_base64, username=admin["username"])


def handle_admin_mfa_verify(payload: dict, client_ip: str) -> dict:
    valid, error = _required_fields(payload, ["temp_token", "otp"])
    if not valid:
        return make_response(STATUS["ERROR"], error)

    temp_token = payload["temp_token"].strip()
    otp = payload["otp"].strip()

    temp_state = get_admin_mfa_temp(temp_token)
    if not temp_state:
        return make_response(STATUS["ERROR"], "Invalid admin MFA temp token.")

    if _is_expired(temp_state["expires_at"]):
        clear_admin_mfa_temp(temp_token)
        return make_response(STATUS["ERROR"], "Admin MFA session expired.")

    admin = get_admin_by_id(temp_state["admin_id"])
    if not admin:
        clear_admin_mfa_temp(temp_token)
        return make_response(STATUS["ERROR"], "Admin not found.")

    if not admin["mfa_secret"]:
        return make_response(STATUS["ERROR"], "Admin MFA secret not found.")

    if not verify_totp_code(admin["mfa_secret"], otp):
        log_event(EVENTS["ADMIN_MFA_FAIL"], "error", username=admin["username"], ip_address=client_ip, details="Invalid admin OTP.")
        return make_response(STATUS["ERROR"], "Invalid admin MFA OTP code.")

    admin_session_token = create_admin_session(admin["id"])
    clear_admin_mfa_temp(temp_token)

    log_event(EVENTS["ADMIN_MFA_SUCCESS"], "success", username=admin["username"], ip_address=client_ip, details="Admin MFA verified successfully.")

    return make_response(STATUS["SESSION_CREATED"], "Admin login successful.", admin_session_token=admin_session_token, username=admin["username"])


def handle_admin_logout(payload: dict, client_ip: str) -> dict:
    valid, error = _required_fields(payload, ["admin_session_token"])
    if not valid:
        return make_response(STATUS["ERROR"], error)

    session_token = payload["admin_session_token"].strip()
    success = revoke_admin_session(session_token)

    if not success:
        return make_response(STATUS["ERROR"], "Invalid or already revoked admin session token.")

    log_event(EVENTS["ADMIN_LOGOUT"], "success", ip_address=client_ip, details="Admin logged out successfully.")
    return make_response(STATUS["SUCCESS"], "Admin logged out successfully.")