import json
import socket

from backend.common.config import settings
from backend.common.constants import ACTIONS, STATUS
from backend.socket_server.protocol import validate_request, make_response
from backend.socket_server.handlers import (
    handle_register_start,
    handle_verify_email_otp,
    handle_login_start,
    handle_login_verify,
    handle_generate_qr_access,
    handle_mfa_verify,
    handle_logout,
    handle_admin_login_start,
    handle_admin_generate_qr_access,
    handle_admin_mfa_verify,
    handle_admin_logout,
)

ACTION_HANDLER_MAP = {
    ACTIONS["REGISTER_START"]: handle_register_start,
    ACTIONS["VERIFY_EMAIL_OTP"]: handle_verify_email_otp,
    ACTIONS["LOGIN_START"]: handle_login_start,
    ACTIONS["LOGIN_VERIFY"]: handle_login_verify,
    ACTIONS["GENERATE_QR_ACCESS"]: handle_generate_qr_access,
    ACTIONS["MFA_VERIFY"]: handle_mfa_verify,
    ACTIONS["LOGOUT"]: handle_logout,
    ACTIONS["ADMIN_LOGIN_START"]: handle_admin_login_start,
    ACTIONS["ADMIN_GENERATE_QR_ACCESS"]: handle_admin_generate_qr_access,
    ACTIONS["ADMIN_MFA_VERIFY"]: handle_admin_mfa_verify,
    ACTIONS["ADMIN_LOGOUT"]: handle_admin_logout,
}


def process_request(raw_data: bytes, client_ip: str) -> bytes:
    try:
        payload = json.loads(raw_data.decode("utf-8"))
    except json.JSONDecodeError:
        response = make_response(STATUS["ERROR"], "Invalid JSON payload.")
        return json.dumps(response).encode("utf-8")

    is_valid, validation_message = validate_request(payload)
    if not is_valid:
        response = make_response(STATUS["ERROR"], validation_message)
        return json.dumps(response).encode("utf-8")

    action = payload["action"]
    handler = ACTION_HANDLER_MAP.get(action)

    if handler is None:
        response = make_response(STATUS["ERROR"], f"No handler configured for action: {action}")
        return json.dumps(response).encode("utf-8")

    try:
        response = handler(payload, client_ip)
    except Exception as exc:
        response = make_response(STATUS["ERROR"], "Internal server error.", details=str(exc))

    return json.dumps(response).encode("utf-8")


def start_socket_server() -> None:
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((settings.SOCKET_HOST, settings.SOCKET_PORT))
    server.listen(5)

    print(f"[SOCKET] Listening on {settings.SOCKET_HOST}:{settings.SOCKET_PORT}")

    try:
        while True:
            conn, addr = server.accept()
            client_ip = addr[0]

            with conn:
                data = conn.recv(8192)
                if not data:
                    continue

                response = process_request(data, client_ip)
                conn.sendall(response)

    except KeyboardInterrupt:
        print("\n[SOCKET] Server stopped manually.")
    finally:
        server.close()
        print("[SOCKET] Server closed.")


if __name__ == "__main__":
    start_socket_server()