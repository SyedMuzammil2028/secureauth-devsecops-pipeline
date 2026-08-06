from pydantic import BaseModel


class AdminLoginStartSchema(BaseModel):
    username: str
    password: str


class AdminTempTokenSchema(BaseModel):
    temp_token: str


class AdminMFAVerifySchema(BaseModel):
    temp_token: str
    otp: str


class AdminSessionSchema(BaseModel):
    admin_session_token: str


class UnlockUserSchema(BaseModel):
    admin_session_token: str
    user_id: int


class LockUserSchema(BaseModel):
    admin_session_token: str
    user_id: int
    lock_minutes: int = 10
    reason: str = "Locked manually by administrator."


class SuspendUserSchema(BaseModel):
    admin_session_token: str
    user_id: int
    is_suspended: bool
    reason: str = "Account status updated by administrator."


class DeleteUserSchema(BaseModel):
    admin_session_token: str
    user_id: int
    reason: str = "Soft deleted by administrator."


class RevokeSessionSchema(BaseModel):
    admin_session_token: str
    session_token: str


class AdminChangePasswordSchema(BaseModel):
    admin_session_token: str
    current_password: str
    new_password: str


class AdminUpdateProfileSchema(BaseModel):
    admin_session_token: str
    username: str