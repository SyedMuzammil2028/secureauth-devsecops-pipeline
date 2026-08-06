CREATE_TABLES_SQL = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        date_of_birth TEXT,
        gender TEXT,
        nationality TEXT,
        country_code TEXT,
        phone_number TEXT,
        postal_code TEXT,
        is_email_verified INTEGER DEFAULT 0,
        mfa_secret TEXT,
        mfa_enabled INTEGER DEFAULT 1,
        failed_attempts INTEGER DEFAULT 0,
        lock_until TEXT,
        is_suspended INTEGER DEFAULT 0,
        suspension_reason TEXT,
        is_deleted INTEGER DEFAULT 0,
        deletion_reason TEXT,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS pending_email_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        purpose TEXT NOT NULL,
        username TEXT,
        expires_at TEXT NOT NULL,
        is_used INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS nonces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        nonce_value TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        is_used INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS mfa_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        temp_token TEXT UNIQUE NOT NULL,
        qr_session_token TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        login_identifier TEXT NOT NULL,
        ip_address TEXT,
        issued_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        is_revoked INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        ip_address TEXT,
        details TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        mfa_secret TEXT,
        mfa_enabled INTEGER DEFAULT 1,
        failed_attempts INTEGER DEFAULT 0,
        lock_until TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS admin_mfa_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        temp_token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(admin_id) REFERENCES admin_users(id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS admin_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        issued_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        is_revoked INTEGER DEFAULT 0,
        FOREIGN KEY(admin_id) REFERENCES admin_users(id)
    );
    """,
]

CREATE_INDEXES_SQL = [
    "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
    "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
    "CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);",
    "CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended);",
    "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);",
    "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_logs_user_id ON audit_logs(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_logs_event_type ON audit_logs(event_type);",
    "CREATE INDEX IF NOT EXISTS idx_pending_email_email ON pending_email_verifications(email);",
    "CREATE INDEX IF NOT EXISTS idx_nonces_user_id ON nonces(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);",
    "CREATE INDEX IF NOT EXISTS idx_admin_users_lock_until ON admin_users(lock_until);",
    "CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);",
    "CREATE INDEX IF NOT EXISTS idx_admin_mfa_temp_token ON admin_mfa_temp(temp_token);",
]