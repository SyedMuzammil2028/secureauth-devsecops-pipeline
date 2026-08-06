#!/bin/sh
set -eu

python -m backend.database.init_db
python -m backend.database.migrate_security_controls

if [ -n "${ADMIN_USERNAME:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
    python -m backend.database.create_admin
else
    echo "ADMIN_USERNAME or ADMIN_PASSWORD is unset; skipping default admin creation."
fi

exec "$@"

