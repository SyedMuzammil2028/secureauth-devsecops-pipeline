from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from backend.api.schemas.admin_schema import (
    AdminLoginStartSchema,
    AdminTempTokenSchema,
    AdminMFAVerifySchema,
    AdminSessionSchema,
    UnlockUserSchema,
    LockUserSchema,
    SuspendUserSchema,
    DeleteUserSchema,
    RevokeSessionSchema,
    AdminChangePasswordSchema,
    AdminUpdateProfileSchema,
)
from backend.api.services.admin_service import (
    get_dashboard_stats,
    get_all_users,
    get_all_logs,
    get_locked_accounts,
    unlock_user,
    lock_user,
    suspend_user,
    soft_delete_user,
    get_all_sessions,
    revoke_user_session,
    change_admin_password,
    clear_audit_logs,
    update_admin_profile,
)
from backend.socket_server.admin_service import (
    verify_admin_credentials,
    create_admin_mfa_temp,
    get_admin_mfa_temp,
    get_admin_by_id,
    clear_admin_mfa_temp,
    create_admin_session,
    revoke_admin_session,
)
from backend.socket_server.mfa_service import generate_qr_base64, verify_totp_code
from backend.socket_server.rate_limiter import rate_limiter

router = APIRouter()


def get_client_ip(request: Request):
    if request.client:
        return request.client.host
    return "unknown"


def is_expired(value: str | None) -> bool:
    if not value:
        return True

    try:
        parsed = datetime.fromisoformat(value)

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)

        return datetime.now(timezone.utc) > parsed

    except ValueError:
        return True


@router.post("/login-start")
def admin_login_start(payload: AdminLoginStartSchema, request: Request):
    client_ip = get_client_ip(request)
    key = f"admin_login:{client_ip}:{payload.username}"

    if not rate_limiter.is_allowed(key):
        raise HTTPException(
            status_code=429,
            detail="Too many admin login attempts from this IP. Try again later.",
        )

    success, message, admin = verify_admin_credentials(
        payload.username,
        payload.password,
    )

    if not success:
        raise HTTPException(status_code=401, detail=message)

    temp_token = create_admin_mfa_temp(admin["id"])

    return {
        "status": "mfa_required",
        "message": "Admin primary authentication successful. Proceed to MFA verification.",
        "temp_token": temp_token,
    }


@router.post("/generate-qr")
def admin_generate_qr(payload: AdminTempTokenSchema):
    temp_state = get_admin_mfa_temp(payload.temp_token)

    if not temp_state:
        raise HTTPException(status_code=400, detail="Invalid admin MFA temp token.")

    if is_expired(temp_state["expires_at"]):
        clear_admin_mfa_temp(payload.temp_token)
        raise HTTPException(status_code=400, detail="Admin MFA session expired.")

    admin = get_admin_by_id(temp_state["admin_id"])

    if not admin:
        clear_admin_mfa_temp(payload.temp_token)
        raise HTTPException(status_code=404, detail="Admin not found.")

    qr_data = generate_qr_base64(admin["username"], admin["mfa_secret"])

    return {
        "status": "qr_ready",
        "message": "Admin QR code generated successfully.",
        "qr_data": qr_data,
        "username": admin["username"],
    }


@router.post("/mfa-verify")
def admin_mfa_verify(payload: AdminMFAVerifySchema):
    temp_state = get_admin_mfa_temp(payload.temp_token)

    if not temp_state:
        raise HTTPException(status_code=400, detail="Invalid admin MFA temp token.")

    if is_expired(temp_state["expires_at"]):
        clear_admin_mfa_temp(payload.temp_token)
        raise HTTPException(status_code=400, detail="Admin MFA session expired.")

    admin = get_admin_by_id(temp_state["admin_id"])

    if not admin:
        clear_admin_mfa_temp(payload.temp_token)
        raise HTTPException(status_code=404, detail="Admin not found.")

    if not verify_totp_code(admin["mfa_secret"], payload.otp):
        raise HTTPException(status_code=400, detail="Invalid admin MFA OTP code.")

    token = create_admin_session(admin["id"])
    clear_admin_mfa_temp(payload.temp_token)

    return {
        "status": "success",
        "message": "Admin login successful.",
        "admin_session_token": token,
    }


@router.post("/logout")
def admin_logout(payload: AdminSessionSchema):
    success = revoke_admin_session(payload.admin_session_token)

    if not success:
        raise HTTPException(status_code=400, detail="Invalid admin session token.")

    return {
        "status": "success",
        "message": "Admin logged out successfully.",
    }


@router.post("/dashboard")
def dashboard(payload: AdminSessionSchema):
    result, error = get_dashboard_stats(payload.admin_session_token)

    if error:
        raise HTTPException(status_code=401, detail=error)

    return result


@router.post("/users")
def users(payload: AdminSessionSchema):
    result, error = get_all_users(payload.admin_session_token)

    if error:
        raise HTTPException(status_code=401, detail=error)

    return {"users": result}


@router.post("/logs")
def logs(payload: AdminSessionSchema):
    result, error = get_all_logs(payload.admin_session_token)

    if error:
        raise HTTPException(status_code=401, detail=error)

    return {"logs": result}


@router.post("/clear-logs")
def clear_logs(payload: AdminSessionSchema):
    success, message = clear_audit_logs(payload.admin_session_token)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }


@router.post("/locked-accounts")
def locked_accounts(payload: AdminSessionSchema):
    result, error = get_locked_accounts(payload.admin_session_token)

    if error:
        raise HTTPException(status_code=401, detail=error)

    return {"locked_accounts": result}


@router.post("/unlock-user")
def unlock(payload: UnlockUserSchema):
    success, message = unlock_user(payload.admin_session_token, payload.user_id)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }


@router.post("/lock-user")
def lock(payload: LockUserSchema):
    success, message = lock_user(
        admin_session_token=payload.admin_session_token,
        user_id=payload.user_id,
        lock_minutes=payload.lock_minutes,
        reason=payload.reason,
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }


@router.post("/suspend-user")
def suspend(payload: SuspendUserSchema):
    success, message = suspend_user(
        admin_session_token=payload.admin_session_token,
        user_id=payload.user_id,
        is_suspended=payload.is_suspended,
        reason=payload.reason,
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }


@router.post("/delete-user")
def delete_user(payload: DeleteUserSchema):
    success, message = soft_delete_user(
        admin_session_token=payload.admin_session_token,
        user_id=payload.user_id,
        reason=payload.reason,
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }


@router.post("/sessions")
def sessions(payload: AdminSessionSchema):
    result, error = get_all_sessions(payload.admin_session_token)

    if error:
        raise HTTPException(status_code=401, detail=error)

    return {"sessions": result}


@router.post("/revoke-session")
def revoke(payload: RevokeSessionSchema):
    success, message = revoke_user_session(
        payload.admin_session_token,
        payload.session_token,
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }


@router.post("/change-password")
def change_password(payload: AdminChangePasswordSchema):
    success, message = change_admin_password(
        admin_session_token=payload.admin_session_token,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }


@router.post("/update-profile")
def update_profile(payload: AdminUpdateProfileSchema):
    success, message = update_admin_profile(
        admin_session_token=payload.admin_session_token,
        username=payload.username,
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }