# System Architecture Diagram

This diagram shows the SecureAuth frontend, FastAPI backend, internal socket-auth logic, SQLite database, SMTP OTP service, MFA, sessions, audit logs, and Render deployment.

```mermaid
flowchart TD
    U[User / Admin Browser] --> FE[React + TypeScript Frontend<br/>Vite + shadcn/ui]

    FE -->|HTTPS REST API| API[FastAPI Backend<br/>Render Web Service]

    API --> CORS[CORS + Request Validation]
    CORS --> AR[API Routers]

    AR --> CR[Client Auth Routes<br/>Register, Login, OTP, MFA]
    AR --> ADM[Admin Routes<br/>Dashboard, Logs, Users, Sessions]
    AR --> USER[User Routes<br/>Profile, Sessions, Email Change, Delete Account]

    CR --> SOCK[Socket Auth Logic<br/>process_request handlers]
    SOCK --> AUTH[Auth Services<br/>Password Hashing, Nonce, HMAC]
    SOCK --> OTP[Email OTP Service]
    SOCK --> MFA[TOTP / QR MFA Service]
    SOCK --> SESS[Session Token Service]
    SOCK --> AUDIT[Audit Logging Service]

    ADM --> ADMINAUTH[Admin Auth + MFA]
    ADM --> ADMINOPS[Admin Management<br/>Lock, Unlock, Suspend, Soft Delete]
    ADM --> AUDIT
    ADM --> SESS

    USER --> USEROPS[User Profile / Account Services]
    USEROPS --> OTP
    USEROPS --> SESS
    USEROPS --> AUDIT

    OTP --> SMTP[SMTP Provider<br/>Brevo / Gmail]
    SMTP --> MAIL[User Email Inbox]

    MFA --> QR[QR Code / Authenticator App]
    AUTH --> DB[(SQLite Database)]
    OTP --> DB
    MFA --> DB
    SESS --> DB
    AUDIT --> DB
    ADMINAUTH --> DB
    ADMINOPS --> DB
    USEROPS --> DB

    DB --> TABLES[Tables:<br/>users<br/>admins<br/>sessions<br/>admin_sessions<br/>pending_email_verifications<br/>mfa_temp_tokens<br/>login_nonces<br/>audit_logs]

    FE -. Deployed as .-> RENDERFE[Render Static Site]
    API -. Deployed as .-> RENDERAPI[Render Python Web Service]
    RENDERFE -->|VITE_API_BASE_URL| RENDERAPI

```
