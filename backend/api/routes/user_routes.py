from fastapi import APIRouter, HTTPException

from backend.api.schemas.user_schema import (
    SessionTokenSchema,
    DeleteAccountSchema,
)
from backend.api.services.user_service import (
    get_user_profile,
    get_user_sessions,
    delete_own_account,
)

router = APIRouter()


@router.post("/profile")
def profile(payload: SessionTokenSchema):
    result, error = get_user_profile(payload.session_token)
    if error:
        raise HTTPException(status_code=401, detail=error)
    return result


@router.post("/sessions")
def sessions(payload: SessionTokenSchema):
    result, error = get_user_sessions(payload.session_token)
    if error:
        raise HTTPException(status_code=401, detail=error)
    return {"sessions": result}


@router.post("/delete-account")
def delete_account(payload: DeleteAccountSchema):
    success, message = delete_own_account(
        session_token=payload.session_token,
        otp=payload.otp,
        reason=payload.reason,
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }