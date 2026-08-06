from pydantic import BaseModel


class SessionTokenSchema(BaseModel):
    session_token: str


class DeleteAccountSchema(BaseModel):
    session_token: str
    otp: str
    reason: str = "User requested account deletion."