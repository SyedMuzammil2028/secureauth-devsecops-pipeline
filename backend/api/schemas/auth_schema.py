# auth_schema placeholder
from pydantic import BaseModel, EmailStr


class EmailChangeRequestSchema(BaseModel):
    session_token: str
    new_email: EmailStr


class EmailChangeVerifySchema(BaseModel):
    session_token: str
    new_email: EmailStr
    otp_code: str