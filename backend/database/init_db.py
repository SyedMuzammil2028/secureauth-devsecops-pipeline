# Database initialization placeholder
from backend.database.db import get_db
from backend.database.models import CREATE_TABLES_SQL, CREATE_INDEXES_SQL


def init_database() -> None:
    with get_db() as conn:
        cursor = conn.cursor()

        for query in CREATE_TABLES_SQL:
            cursor.execute(query)

        for query in CREATE_INDEXES_SQL:
            cursor.execute(query)

    print("Database initialized successfully.")


if __name__ == "__main__":
    init_database()