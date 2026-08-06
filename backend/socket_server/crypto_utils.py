# crypto_utils placeholder
import base64
import bcrypt
import hashlib
import hmac
import secrets
from backend.common.helpers import generate_token


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def generate_nonce(length: int = 32) -> str:
    return secrets.token_hex(length // 2)


def derive_key_from_password(password: str) -> str:
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).decode("utf-8")


def build_hmac_response(password: str, nonce: str) -> str:
    derived_key = hashlib.sha256(password.encode("utf-8")).digest()
    signature = hmac.new(derived_key, nonce.encode("utf-8"), hashlib.sha256).hexdigest()
    return signature


def verify_hmac_response(password: str, nonce: str, received_hmac: str) -> bool:
    expected = build_hmac_response(password, nonce)
    return hmac.compare_digest(expected, received_hmac)


def generate_session_token() -> str:
    return generate_token(32)


def generate_temp_token() -> str:
    return generate_token(24)