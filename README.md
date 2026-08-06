# SecureAuth - Secure Network-Based User Authentication System

SecureAuth is a Computer Networks project that demonstrates secure user authentication using Python socket programming, FastAPI, SQLite, and a React + TypeScript frontend.

## Features

- Python socket-based authentication logic
- FastAPI backend for frontend API requests
- React + TypeScript + Vite frontend
- SQLite database with initialization and migration scripts
- Email OTP verification for registration and email change
- QR/TOTP multi-factor authentication
- Session token creation, expiry checks, and revocation
- Rate limiting and account lockout
- Admin dashboard with user, session, lock, and log management
- User dashboard with profile, sessions, email change, logout, and delete-account controls
- Audit logging for important authentication and admin actions

## Project Structure

```text
backend/        FastAPI API, socket auth logic, services, and database scripts
docs/           System architecture and authentication flow diagrams
frontend/       React + TypeScript + Vite frontend
.env.example    Backend environment template
render.yaml     Render deployment blueprint
requirements.txt
README.md
```

## Documentation

- [System Architecture Diagram](docs/SYSTEM_ARCHITECTURE.md)
- [Authentication Flow Diagram](docs/AUTHENTICATION_FLOW_DIAGRAM.md)

## Requirements

Install these before running the project:

- Python 3.11 or newer
- Node.js 20.19 or newer, or Node.js 22.13 or newer
- npm
- Git
- SMTP account for OTP email delivery, such as Brevo or Gmail app password

Check versions on Windows PowerShell:

```powershell
python --version
node --version
npm --version
git --version
```

## Download From GitHub

Clone the repository:

```powershell
git clone https://github.com/SyedMuzammil2028/secureauth-socket-system.git
cd secureauth-socket-system
```

Or download it manually:

1. Open the GitHub repository.
2. Click `Code`.
3. Click `Download ZIP`.
4. Extract the ZIP.
5. Open PowerShell inside the extracted project folder.

## Environment Setup

This project does not include real `.env` files. Create them locally from the examples.

```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

Open the backend `.env` file:

```powershell
notepad .env
```

Minimum backend values to update:

```text
APP_ENV=development
SECRET_KEY=replace_with_a_long_random_secret

DB_PATH=backend/database/auth_system.db

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_EMAIL=your_brevo_smtp_login
SMTP_PASSWORD=your_brevo_smtp_key
SMTP_TIMEOUT_SECONDS=30

ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPassword@123
```

For Gmail SMTP instead of Brevo:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_16_character_gmail_app_password
SMTP_TIMEOUT_SECONDS=30
```

The frontend `.env` should normally stay as:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Backend Setup

Run these commands from the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If virtual environment activation is blocked, run this once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then activate the virtual environment again:

```powershell
.\.venv\Scripts\Activate.ps1
```

## Database Setup

Keep the virtual environment activated. Do not deactivate it before running these commands.

```powershell
python -m backend.database.init_db
python -m backend.database.migrate_security_controls
python -m backend.database.create_admin
```

This creates a local SQLite database at:

```text
backend/database/auth_system.db
```

Do not commit or upload this database file.

## Run Locally

For local development, run the socket server and FastAPI server in separate terminals.

### Terminal 1: Socket Server

```powershell
.\.venv\Scripts\Activate.ps1
python -m backend.socket_server.server
```

Expected output:

```text
[SOCKET] Listening on 127.0.0.1:9000
```

### Terminal 2: FastAPI Backend

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API:

```text
http://127.0.0.1:8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

### Terminal 3: Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Frontend:

```text
http://127.0.0.1:5173
```

If `npm ci` shows vulnerability warnings, that is not automatically a setup failure. Do not run this unless you intentionally want to upgrade packages and retest:

```powershell
npm audit fix --force
```

## Build Check

To verify the frontend production build:

```powershell
cd frontend
npm run build
```

To preview the production build locally:

```powershell
npm run preview
```

## Demo Flow

1. Register a new user.
2. Verify the email OTP.
3. Log in using username/email and password.
4. Scan the QR code in an authenticator app.
5. Enter the TOTP MFA code.
6. Open the user dashboard.
7. Log in as admin using the admin credentials from `.env`.
8. Review users, sessions, logs, locked accounts, and settings.

## Render Deployment

This repository includes `render.yaml` for Render deployment.

Recommended deployed services:

```text
secureauth-api-v2       Render Python Web Service
secureauth-frontend     Render Static Site
```

### Backend Web Service

```text
Runtime: Python
Branch: main
Build Command: pip install -r requirements.txt
Start Command: python -m backend.database.init_db && python -m backend.database.migrate_security_controls && python -m backend.database.create_admin && uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

Required backend environment variables:

```text
PYTHON_VERSION=3.11.9
APP_ENV=production
DB_PATH=backend/database/auth_system.db
CORS_ORIGINS=https://secureauth-frontend.onrender.com
SECRET_KEY=your_long_random_secret

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_EMAIL=your_brevo_smtp_login
SMTP_PASSWORD=your_brevo_smtp_key
SMTP_TIMEOUT_SECONDS=30

ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPassword@123
EMAIL_OTP_EXPIRY_MINUTES=5
MFA_TEMP_EXPIRY_MINUTES=5
NONCE_EXPIRY_MINUTES=2
SESSION_EXPIRY_HOURS=12
MAX_FAILED_ATTEMPTS=5
LOCKOUT_MINUTES=10
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=10
```

Backend health check:

```text
https://secureauth-api-v2.onrender.com/health
```

### Frontend Static Site

```text
Branch: main
Root Directory: frontend
Build Command: npm install --include=optional && npm install --no-save @rollup/rollup-linux-x64-gnu@4.60.2 && npm run build
Publish Directory: dist
```

Required frontend environment variable:

```text
VITE_API_BASE_URL=https://secureauth-api-v2.onrender.com
```

React Router rewrite rule:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

### Render Notes

- Render free services can sleep when inactive, so the first request after inactivity can be slow.
- This project uses SQLite for a course demo. On Render, SQLite data may reset after redeploys or restarts unless persistent storage is attached.
- The standalone TCP socket server is for local demonstration. On Render, FastAPI calls the socket authentication handlers internally.
- Never put real SMTP passwords or `.env` files in GitHub.

## Troubleshooting

If OTP emails are not received:

- Confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD`, and `SMTP_TIMEOUT_SECONDS`.
- For Brevo, use the SMTP login and SMTP key, not the normal account password.
- For Gmail, use a Gmail app password, not the normal Gmail password.
- Check spam/junk folders.
- Check Render backend logs for `[EMAIL ERROR]`.

If frontend API calls fail:

- Local: confirm FastAPI is running on `http://127.0.0.1:8000`.
- Local: confirm `frontend/.env` has `VITE_API_BASE_URL=http://127.0.0.1:8000`.
- Render: confirm `VITE_API_BASE_URL=https://secureauth-api-v2.onrender.com`.
- Restart or redeploy the frontend after changing Vite environment variables.

If database errors occur locally:

```powershell
Remove-Item backend\database\auth_system.db
python -m backend.database.init_db
python -m backend.database.migrate_security_controls
python -m backend.database.create_admin
```

## Final Submission Cleanup

Do not upload these files or folders:

```text
.env
frontend/.env
backend/database/auth_system.db
__pycache__/
*.pyc
.pytest_cache/
venv/
.venv/
frontend/node_modules/
frontend/dist/
*.zip
*.log
*.tmp
*.bak
```

These files should remain in the repository:

```text
.env.example
frontend/.env.example
.gitignore
render.yaml
requirements.txt
README.md
backend/
docs/
frontend/
frontend/package.json
frontend/package-lock.json
```

## DevSecOps pipeline

Docker images, Jenkins CI/CD, SonarQube/Trivy scanning, and Kubernetes Dev/Staging/Production deployments are documented in [docs/DEVSECOPS_LAB.md](docs/DEVSECOPS_LAB.md).
