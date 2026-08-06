from backend.database.db import get_db


def add_column_if_missing(conn, table_name: str, column_name: str, column_sql: str):
    columns = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    existing_columns = {column["name"] for column in columns}

    if column_name not in existing_columns:
        conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_sql}")
        print(f"Added column: {table_name}.{column_name}")
    else:
        print(f"Column already exists: {table_name}.{column_name}")


def main():
    with get_db() as conn:
        add_column_if_missing(
            conn,
            "users",
            "is_suspended",
            "is_suspended INTEGER DEFAULT 0",
        )
        add_column_if_missing(
            conn,
            "users",
            "suspension_reason",
            "suspension_reason TEXT",
        )
        add_column_if_missing(
            conn,
            "users",
            "is_deleted",
            "is_deleted INTEGER DEFAULT 0",
        )
        add_column_if_missing(
            conn,
            "users",
            "deletion_reason",
            "deletion_reason TEXT",
        )
        add_column_if_missing(
            conn,
            "users",
            "deleted_at",
            "deleted_at TEXT",
        )

        add_column_if_missing(
            conn,
            "admin_users",
            "failed_attempts",
            "failed_attempts INTEGER DEFAULT 0",
        )
        add_column_if_missing(
            conn,
            "admin_users",
            "lock_until",
            "lock_until TEXT",
        )
        add_column_if_missing(
            conn,
            "admin_users",
            "updated_at",
            "updated_at TEXT",
        )

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_admin_users_lock_until ON admin_users(lock_until)"
        )

    print("Security controls migration completed successfully.")


if __name__ == "__main__":
    main()