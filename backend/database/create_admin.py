import os

from backend.socket_server.admin_service import create_default_admin


def main():
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD", "ChangeMe@12345")

    success, message = create_default_admin(username, password)
    print(message)

    if success:
        print(f"Admin username: {username}")
        print("Change the default ADMIN_PASSWORD in .env before real use.")


if __name__ == "__main__":
    main()
