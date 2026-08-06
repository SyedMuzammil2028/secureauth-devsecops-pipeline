# Authentication Flow Diagram

This diagram shows the complete SecureAuth authentication flow, including user registration, email OTP verification, challenge-response login, QR/TOTP MFA, session creation, and admin authentication.

```mermaid
flowchart TD
    START([Start]) --> ROLE{User Type}

    ROLE -->|New User| REG[Open Register Page]
    ROLE -->|Existing User| LOGIN[Open Login Page]
    ROLE -->|Admin| ADMINLOGIN[Open Admin Login Page]

    %% Registration and Email OTP
    REG --> REGFORM[Enter Profile Details and Password]
    REGFORM --> REGAPI[POST /api/client/register-start]
    REGAPI --> VALIDATE[FastAPI Validates Request Data]
    VALIDATE --> SOCKREG[Internal Socket Auth Handler]
    SOCKREG --> OTPGEN[Generate Email OTP]
    OTPGEN --> OTPSAVE[(Store OTP in SQLite)]
    OTPGEN --> SMTP[Send OTP through SMTP Provider]
    SMTP --> EMAIL[User Email Inbox]
    EMAIL --> OTPINPUT[User Enters OTP]
    OTPINPUT --> OTPVERIFY[POST /api/client/verify-email-otp]
    OTPVERIFY --> CHECKOTP[Verify OTP, Purpose, Used Flag, and Expiry]
    CHECKOTP -->|Valid| CREATEUSER[Create Verified User Account]
    CHECKOTP -->|Invalid or Expired| OTPFAIL[Return OTP Error]
    CREATEUSER --> LOGIN

    %% User Login Challenge Response
    LOGIN --> CREDS[Enter Username or Email and Password]
    CREDS --> LOGINSTART[POST /api/client/login-start]
    LOGINSTART --> RATE1[Rate Limit Check]
    RATE1 --> PASSCHECK[Verify Password Hash and Account Status]
    PASSCHECK -->|Invalid| LOGINFAIL[Return Login Error]
    PASSCHECK -->|Valid| NONCE[Create Login Nonce]
    NONCE --> NONCEDB[(Store Nonce in SQLite)]
    NONCE --> HMAC[Frontend Computes HMAC Password + Nonce]
    HMAC --> LOGINVERIFY[POST /api/client/login-verify]
    LOGINVERIFY --> NONCECHECK[Check Nonce Exists, Not Used, Not Expired]
    NONCECHECK --> HMACCHECK[Verify HMAC Proof]
    HMACCHECK -->|Invalid| LOGINFAIL
    HMACCHECK -->|Valid| MFATEMP[Create MFA Temp Token]

    %% MFA and Session
    MFATEMP --> MFADECISION{MFA Setup Needed?}
    MFADECISION -->|Yes| QR[Generate QR Code]
    QR --> AUTHAPP[Scan with Authenticator App]
    AUTHAPP --> TOTP[Enter TOTP Code]
    MFADECISION -->|No| TOTP
    TOTP --> MFAVERIFY[POST /api/client/mfa-verify]
    MFAVERIFY --> TOTPVERIFY[Verify TOTP and MFA Temp Token Expiry]
    TOTPVERIFY -->|Invalid| MFAFAIL[Return MFA Error]
    TOTPVERIFY -->|Valid| SESSION[Create Session Token]
    SESSION --> SESSIONDB[(Store Session with Expiry)]
    SESSION --> USERDASH[User Dashboard]

    %% Admin Login
    ADMINLOGIN --> ADMINCREDS[Enter Admin Username and Password]
    ADMINCREDS --> ADMINSTART[POST /api/admin/login-start]
    ADMINSTART --> ARATE[Admin Rate Limit Check]
    ARATE --> ADMINPASS[Verify Admin Credentials]
    ADMINPASS -->|Invalid| ADMINFAIL[Return Admin Login Error]
    ADMINPASS -->|Valid| ADMINMFA[Create Admin MFA Temp Token]
    ADMINMFA --> ADMINQR[Generate Admin QR if Needed]
    ADMINQR --> ADMINTOTP[Enter Admin TOTP Code]
    ADMINMFA --> ADMINTOTP
    ADMINTOTP --> ADMINVERIFY[POST /api/admin/mfa-verify]
    ADMINVERIFY --> ADMINSESSION[Create Admin Session Token]
    ADMINSESSION --> ADMINDASH[Admin Dashboard]
    ADMINDASH --> ADMINOPS[Manage Users, Sessions, Locks, Logs]

    %% Shared Security and Storage
    CREATEUSER --> DB[(SQLite Database)]
    PASSCHECK --> DB
    SESSIONDB --> DB
    ADMINPASS --> DB
    ADMINSESSION --> DB
    ADMINOPS --> DB

    REGAPI -.-> AUDIT[Audit Logging]
    LOGINSTART -.-> AUDIT
    LOGINVERIFY -.-> AUDIT
    MFAVERIFY -.-> AUDIT
    ADMINSTART -.-> AUDIT
    ADMINVERIFY -.-> AUDIT
    ADMINOPS -.-> AUDIT
    AUDIT --> DB

    SECURITY[Security Controls:<br/>Rate Limiting<br/>Account Lockout<br/>OTP Expiry<br/>Nonce Expiry<br/>MFA Temp Expiry<br/>Session Expiry<br/>Role Separation]
    SECURITY -.-> RATE1
    SECURITY -.-> ARATE
    SECURITY -.-> CHECKOTP
    SECURITY -.-> NONCECHECK
    SECURITY -.-> TOTPVERIFY
    SECURITY -.-> SESSION
    SECURITY -.-> ADMINSESSION
```

## Flow Summary

1. During registration, the user submits profile data and receives an OTP through the configured SMTP provider.
2. The backend stores the OTP in SQLite with expiry and purpose metadata.
3. After OTP verification, the account is created with email verification enabled.
4. During login, the backend verifies the password and generates a nonce.
5. The frontend computes an HMAC proof using the password and nonce.
6. The backend verifies the nonce, expiry, and HMAC proof before allowing MFA.
7. The user completes QR/TOTP MFA, then receives a session token with expiry.
8. Admin login is separated from user login and requires admin credentials plus MFA.
9. All important authentication, MFA, session, and admin actions are written to audit logs.

## Main Security Controls

- Password hashing before storage
- Email OTP verification with expiry
- Nonce-based challenge-response login
- HMAC proof verification
- QR/TOTP multi-factor authentication
- Temporary MFA token expiry
- Session token expiry
- Rate limiting for login and registration attempts
- Account lockout after repeated failures
- Admin and user privilege separation
- Audit logging for security events
