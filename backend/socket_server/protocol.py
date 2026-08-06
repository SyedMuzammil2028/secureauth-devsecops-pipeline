# protocol placeholder
from backend.common.constants import ACTIONS


ALLOWED_ACTIONS = set(ACTIONS.values())


def validate_request(data: dict) -> tuple[bool, str]:
    if not isinstance(data, dict):
        return False, "Request body must be a JSON object."

    action = data.get("action")
    if not action:
        return False, "Missing action field."

    if not isinstance(action, str):
        return False, "Action must be a string."

    if action not in ALLOWED_ACTIONS:
        return False, f"Invalid action: {action}"

    return True, "Valid request."


def make_response(status: str, message: str, **extra) -> dict:
    response = {
        "status": status,
        "message": message,
    }
    response.update(extra)
    return response