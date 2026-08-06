ACTIONS = {
    "REGISTER_START": "register_start",
    "VERIFY_EMAIL_OTP": "verify_email_otp",
    "LOGIN_START": "login_start",
    "LOGIN_VERIFY": "login_verify",
    "GENERATE_QR_ACCESS": "generate_qr_access",
    "MFA_VERIFY": "mfa_verify",
    "LOGOUT": "logout",
    "ADMIN_LOGIN_START": "admin_login_start",
    "ADMIN_GENERATE_QR_ACCESS": "admin_generate_qr_access",
    "ADMIN_MFA_VERIFY": "admin_mfa_verify",
    "ADMIN_LOGOUT": "admin_logout",
}

STATUS = {
    "SUCCESS": "success",
    "ERROR": "error",
    "OTP_SENT": "otp_sent",
    "EMAIL_VERIFIED": "email_verified",
    "CHALLENGE_SENT": "challenge_sent",
    "MFA_REQUIRED": "mfa_required",
    "QR_READY": "qr_ready",
    "SESSION_CREATED": "session_created",
}

EVENTS = {
    "REGISTER_START": "register_start",
    "REGISTER_SUCCESS": "register_success",
    "REGISTER_FAIL": "register_fail",
    "EMAIL_OTP_SENT": "email_otp_sent",
    "EMAIL_OTP_SUCCESS": "email_otp_success",
    "EMAIL_OTP_FAIL": "email_otp_fail",
    "LOGIN_START": "login_start",
    "LOGIN_SUCCESS": "login_success",
    "LOGIN_FAIL": "login_fail",
    "MFA_SUCCESS": "mfa_success",
    "MFA_FAIL": "mfa_fail",
    "SESSION_CREATED": "session_created",
    "LOGOUT": "logout",
    "RATE_LIMITED": "rate_limited",
    "ACCOUNT_LOCKED": "account_locked",
    "ADMIN_LOGIN_SUCCESS": "admin_login_success",
    "ADMIN_LOGIN_FAIL": "admin_login_fail",
    "ADMIN_MFA_SUCCESS": "admin_mfa_success",
    "ADMIN_MFA_FAIL": "admin_mfa_fail",
    "ADMIN_LOGOUT": "admin_logout",
}

EMAIL_VERIFICATION_PURPOSES = {
    "REGISTER": "register",
    "CHANGE_EMAIL": "change_email",
}