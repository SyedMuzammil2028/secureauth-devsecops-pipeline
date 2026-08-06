import json
import os
import tempfile
import unittest
from unittest.mock import patch


class BackendSmokeTests(unittest.TestCase):
    def test_health_handler(self):
        from backend.api.main import health

        self.assertEqual(health(), {"status": "ok"})

    def test_invalid_socket_payload_is_rejected(self):
        from backend.socket_server.server import process_request

        response = json.loads(process_request(b"not-json", "127.0.0.1"))
        self.assertEqual(response["status"], "error")
        self.assertIn("Invalid JSON", response["message"])

    def test_database_initialization_creates_database(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = os.path.join(temp_dir, "auth.db")
            with patch("backend.database.db.settings.DB_PATH", database_path):
                from backend.database.init_db import init_database

                init_database()

            self.assertTrue(os.path.isfile(database_path))


if __name__ == "__main__":
    unittest.main()

