# auth_routes placeholder
from fastapi import APIRouter, HTTPException
from backend.api.schemas.auth_schema import (
    EmailChangeRequestSchema,
    EmailChangeVerifySchema,
)
from backend.api.services.user_service import (
    start_email_change,
    verify_email_change,
)

router = APIRouter()


@router.post("/change-email/request")
def request_email_change(payload: EmailChangeRequestSchema):
    success, message = start_email_change(
        session_token=payload.session_token,
        new_email=payload.new_email,
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "otp_sent",
        "message": message,
        "new_email": payload.new_email,
    }


@router.post("/change-email/verify")
def confirm_email_change(payload: EmailChangeVerifySchema):
    success, message = verify_email_change(
        session_token=payload.session_token,
        new_email=payload.new_email,
        otp_code=payload.otp_code,
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "success",
        "message": message,
    }