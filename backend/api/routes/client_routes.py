from fastapi import APIRouter, HTTPException
from backend.api.schemas.client_schema import (
    RegisterStartSchema,
    VerifyEmailOTPSchema,
    LoginStartSchema,
    LoginVerifySchema,
    TempTokenSchema,
    MFAVerifySchema,
    LogoutSchema,
)
from backend.api.services.client_service import call_socket_action

router = APIRouter()


@router.post("/register-start")
def register_start(payload: RegisterStartSchema):
    response = call_socket_action({
        "action": "register_start",
        **payload.model_dump()
    })

    if response.get("status") == "error":
        raise HTTPException(status_code=400, detail=response.get("message"))

    return response


@router.post("/verify-email-otp")
def verify_email_otp(payload: VerifyEmailOTPSchema):
    response = call_socket_action({
        "action": "verify_email_otp",
        **payload.model_dump()
    })

    if response.get("status") == "error":
        raise HTTPException(status_code=400, detail=response.get("message"))

    return response


@router.post("/login-start")
def login_start(payload: LoginStartSchema):
    response = call_socket_action({
        "action": "login_start",
        **payload.model_dump()
    })

    if response.get("status") == "error":
        raise HTTPException(status_code=400, detail=response.get("message"))

    return response


@router.post("/login-verify")
def login_verify(payload: LoginVerifySchema):
    response = call_socket_action({
        "action": "login_verify",
        **payload.model_dump()
    })

    if response.get("status") == "error":
        raise HTTPException(status_code=400, detail=response.get("message"))

    return response


@router.post("/generate-qr")
def generate_qr(payload: TempTokenSchema):
    response = call_socket_action({
        "action": "generate_qr_access",
        **payload.model_dump()
    })

    if response.get("status") == "error":
        raise HTTPException(status_code=400, detail=response.get("message"))

    return response


@router.post("/mfa-verify")
def mfa_verify(payload: MFAVerifySchema):
    response = call_socket_action({
        "action": "mfa_verify",
        **payload.model_dump()
    })

    if response.get("status") == "error":
        raise HTTPException(status_code=400, detail=response.get("message"))

    return response


@router.post("/logout")
def logout(payload: LogoutSchema):
    response = call_socket_action({
        "action": "logout",
        **payload.model_dump()
    })

    if response.get("status") == "error":
        raise HTTPException(status_code=400, detail=response.get("message"))

    return response