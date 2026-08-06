# mfa_service placeholder
import base64
from io import BytesIO

import pyotp
import qrcode

from backend.common.helpers import utc_now_str, future_time_str
from backend.database.db import get_db
from backend.socket_server.crypto_utils import generate_temp_token


ISSUER_NAME = "SecureAuthSystem"


def generate_mfa_secret() -> str:
    return pyotp.random_base32()


def get_totp(secret: str) -> pyotp.TOTP:
    return pyotp.TOTP(secret)


def build_provisioning_uri(username: str, secret: str) -> str:
    totp = get_totp(secret)
    return totp.provisioning_uri(name=username, issuer_name=ISSUER_NAME)


def generate_qr_base64(username: str, secret: str) -> str:
    uri = build_provisioning_uri(username, secret)

    img = qrcode.make(uri)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return encoded


def verify_totp_code(secret: str, otp: str) -> bool:
    totp = get_totp(secret)
    return totp.verify(otp, valid_window=1)


def create_temp_mfa_state(user_id: int) -> str:
    temp_token = generate_temp_token()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO mfa_temp (user_id, temp_token, qr_session_token, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                user_id,
                temp_token,
                None,
                future_time_str(minutes=5),
                utc_now_str(),
            ),
        )

    return temp_token


def get_temp_mfa_state(temp_token: str):
    with get_db() as conn:
        return conn.execute(
            """
            SELECT * FROM mfa_temp
            WHERE temp_token = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (temp_token,),
        ).fetchone()


def clear_temp_mfa_state(temp_token: str) -> None:
    with get_db() as conn:
        conn.execute(
            "DELETE FROM mfa_temp WHERE temp_token = ?",
            (temp_token,),
        )