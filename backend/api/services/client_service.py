import json

from backend.socket_server.server import process_request


def call_socket_action(payload: dict, client_ip: str = "127.0.0.1") -> dict:
    try:
        raw_request = json.dumps(payload).encode("utf-8")
        raw_response = process_request(raw_request, client_ip)
        return json.loads(raw_response.decode("utf-8"))

    except Exception as exc:
        return {
            "status": "error",
            "message": f"Socket action error: {exc}",
        }
