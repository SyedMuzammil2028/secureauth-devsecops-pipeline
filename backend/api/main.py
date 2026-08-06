import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.auth_routes import router as auth_router
from backend.api.routes.user_routes import router as user_router
from backend.api.routes.admin_routes import router as admin_router
from backend.api.routes.client_routes import router as client_router


def get_allowed_origins() -> list[str]:
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://secureauth-frontend.onrender.com",
    ]

    configured = os.getenv("CORS_ORIGINS", "")
    configured_origins = [
        origin.strip().rstrip("/")
        for origin in configured.split(",")
        if origin.strip()
    ]

    return [*default_origins, *configured_origins]


app = FastAPI(title="Secure Auth System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(user_router, prefix="/api/user", tags=["User"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(client_router, prefix="/api/client", tags=["Client"])


@app.get("/")
def root():
    return {"message": "Secure Auth System API is running."}

@app.get("/health")
def health():
    return {"status": "ok"}

