from backend.common.constants import EMAIL_VERIFICATION_PURPOSES
from backend.common.helpers import (
    password_strength,
    utc_now_str,
    validate_email,
    validate_username,
)
from backend.database.db import get_db
from backend.socket_server.crypto_utils import (
    generate_nonce,
    hash_password,
    verify_password,
)
from backend.socket_server.email_service import create_and_send_email_otp
from backend.socket_server.mfa_service import generate_mfa_secret
from backend.socket_server.lockout_service import (
    is_account_locked,
    record_failed_attempt,
    reset_failed_attempts,
)


def get_user_by_username(username: str):
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,),
        ).fetchone()


def get_user_by_email(email: str):
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,),
        ).fetchone()


def get_user_by_identifier(login_identifier: str):
    user = get_user_by_username(login_identifier)
    if user:
        return user
    return get_user_by_email(login_identifier)


def username_exists(username: str) -> bool:
    return get_user_by_username(username) is not None


def email_exists(email: str) -> bool:
    return get_user_by_email(email) is not None


def validate_registration_payload(payload: dict) -> tuple[bool, list[str]]:
    errors = []

    required_fields = [
        "first_name",
        "last_name",
        "username",
        "email",
        "password",
        "date_of_birth",
        "gender",
        "nationality",
        "country_code",
        "phone_number",
    ]

    for field in required_fields:
        if not payload.get(field):
            errors.append(f"{field} is required.")

    username = payload.get("username", "").strip()
    email = payload.get("email", "").strip()
    password = payload.get("password", "")

    if username and not validate_username(username):
        errors.append("Username must be 4–20 characters and contain only letters, numbers, or underscore.")

    if email and not validate_email(email):
        errors.append("Invalid email format.")

    strong, password_errors = password_strength(password)
    if not strong:
        errors.extend(password_errors)

    if username and username_exists(username):
        errors.append("Username already exists.")

    if email and email_exists(email):
        errors.append("Email already exists.")

    return len(errors) == 0, errors


def start_registration(payload: dict) -> tuple[bool, str]:
    is_valid, errors = validate_registration_payload(payload)
    if not is_valid:
        return False, "; ".join(errors)

    email = payload["email"].strip()
    username = payload["username"].strip()

    ok, message = create_and_send_email_otp(
        email=email,
        purpose=EMAIL_VERIFICATION_PURPOSES["REGISTER"],
        username=username,
    )
    return ok, message


def create_user_after_email_verification(payload: dict) -> tuple[bool, str, int | None]:
    try:
        mfa_secret = generate_mfa_secret()
        password_hash = hash_password(payload["password"])

        with get_db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users (
                    first_name, last_name, username, email, password_hash,
                    date_of_birth, gender, nationality, country_code, phone_number,
                    postal_code, is_email_verified, mfa_secret, mfa_enabled,
                    failed_attempts, lock_until, is_suspended, suspension_reason,
                    is_deleted, deletion_reason, deleted_at, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, 0, NULL, 0, NULL, 0, NULL, NULL, ?, ?)
                """,
                (
                    payload["first_name"].strip(),
                    payload["last_name"].strip(),
                    payload["username"].strip(),
                    payload["email"].strip(),
                    password_hash,
                    payload.get("date_of_birth"),
                    payload.get("gender"),
                    payload.get("nationality"),
                    payload.get("country_code"),
                    payload.get("phone_number"),
                    payload.get("postal_code", ""),
                    mfa_secret,
                    utc_now_str(),
                    utc_now_str(),
                ),
            )
            user_id = cursor.lastrowid

        return True, "User created successfully.", user_id
    except Exception as exc:
        return False, str(exc), None


def create_login_nonce(user_id: int) -> str:
    nonce = generate_nonce()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO nonces (user_id, nonce_value, expires_at, is_used, created_at)
            VALUES (?, ?, datetime('now', '+2 minutes'), 0, ?)
            """,
            (user_id, nonce, utc_now_str()),
        )

    return nonce


def get_active_nonce(user_id: int, nonce_value: str):
    with get_db() as conn:
        return conn.execute(
            """
            SELECT * FROM nonces
            WHERE user_id = ? AND nonce_value = ? AND is_used = 0
            ORDER BY id DESC
            LIMIT 1
            """,
            (user_id, nonce_value),
        ).fetchone()


def mark_nonce_used(nonce_id: int) -> None:
    with get_db() as conn:
        conn.execute(
            "UPDATE nonces SET is_used = 1 WHERE id = ?",
            (nonce_id,),
        )


def verify_login_credentials(login_identifier: str, password: str) -> tuple[bool, str, dict | None]:
    user = get_user_by_identifier(login_identifier)

    if not user:
        return False, "User not found.", None

    if user["is_deleted"]:
        return False, "This account has been deleted.", None

    if user["is_suspended"]:
        reason = user["suspension_reason"] or "Account suspended by administrator."
        return False, reason, None

    locked, lock_until = is_account_locked(user["id"])
    if locked:
        return False, f"Account is locked until {lock_until}.", None

    if not verify_password(password, user["password_hash"]):
        should_lock, _ = record_failed_attempt(user["id"])
        if should_lock:
            return False, "Account locked due to too many failed attempts.", None
        return False, "Invalid password.", None

    reset_failed_attempts(user["id"])
    return True, "Primary credentials verified.", dict(user)