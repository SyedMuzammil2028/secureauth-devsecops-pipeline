from pydantic import BaseModel, EmailStr


class RegisterStartSchema(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    password: str
    date_of_birth: str
    gender: str
    nationality: str
    country_code: str
    phone_number: str
    postal_code: str


class VerifyEmailOTPSchema(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    password: str
    date_of_birth: str
    gender: str
    nationality: str
    country_code: str
    phone_number: str
    otp_code: str


class LoginStartSchema(BaseModel):
    login_identifier: str
    password: str


class LoginVerifySchema(BaseModel):
    login_identifier: str
    password: str
    nonce: str
    hmac_response: str


class TempTokenSchema(BaseModel):
    temp_token: str


class MFAVerifySchema(BaseModel):
    temp_token: str
    otp: str


class LogoutSchema(BaseModel):
    session_token: str