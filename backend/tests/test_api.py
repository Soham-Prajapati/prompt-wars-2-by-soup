import os
import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("GEMINI_API_KEY", "unit-test-key")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "unit-test-project")

import app.main as main  # noqa: E402


class ElectIQApiTests(unittest.TestCase):
    def setUp(self):
        # Clear in-memory event store shared between main and analytics_service
        main._analytics_events.clear()
        # Restore gemini_model to its actual value before each test
        main.gemini_model = main.ai_service.model

    def test_health_endpoint_shape(self):
        with TestClient(main.app) as client:
            response = client.get("/health")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertEqual(payload["status"], "healthy")
            self.assertIn("ai_ready", payload)
            self.assertIn("google_project", payload)
            self.assertIn("analytics_bigquery_table", payload)

    def test_google_services_status_endpoint_shape(self):
        with TestClient(main.app) as client:
            response = client.get("/google-services/status")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertIn("gemini", payload)
            self.assertIn("bigquery", payload)
            self.assertIn("secret_manager", payload)
            self.assertIn("sdk_installed", payload["gemini"])
            self.assertIn("configured", payload["gemini"])

    def test_analytics_event_and_summary(self):
        with TestClient(main.app) as client:
            event_response = client.post(
                "/analytics/event",
                json={
                    "event_name": "unit_test_event",
                    "session_id": "sess_test_001",
                    "page": "/chat",
                    "props": {"source": "unit-test"},
                },
            )
            self.assertEqual(event_response.status_code, 200)
            self.assertEqual(event_response.json()["ok"], True)

            summary_response = client.get("/analytics/summary")
            self.assertEqual(summary_response.status_code, 200)
            summary_payload = summary_response.json()
            self.assertEqual(summary_payload["events_recorded"], 1)
            self.assertIn("unit_test_event", summary_payload["event_types"])

    def test_factcheck_fallback_without_gemini_model(self):
        with TestClient(main.app) as client:
            main.gemini_model = None
            response = client.post(
                "/factcheck",
                json={"text": "EVMs can be hacked via bluetooth", "language": "English"},
            )
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertEqual(payload["overall_verdict"], "UNVERIFIABLE")
            self.assertIn("sources_consulted", payload)

    def test_get_gemini_key_prefers_env(self):
        os.environ["GEMINI_API_KEY"] = "from-env"
        self.assertEqual(main.get_gemini_key(), "from-env")

    def test_factcheck_has_language_field(self):
        with TestClient(main.app) as client:
            main.gemini_model = None
            response = client.post(
                "/factcheck",
                json={"text": "Test claim", "language": "Hindi"},
            )
            payload = response.json()
            self.assertIn("language", payload)
            self.assertEqual(payload["language"], "Hindi")

    def test_analytics_multiple_events(self):
        with TestClient(main.app) as client:
            for event_name in ["event_a", "event_b", "event_a"]:
                client.post(
                    "/analytics/event",
                    json={"event_name": event_name, "session_id": "sess_x", "page": "/", "props": {}},
                )
            summary = client.get("/analytics/summary").json()
            self.assertEqual(summary["events_recorded"], 3)
            self.assertIn("event_a", summary["event_types"])
            self.assertIn("event_b", summary["event_types"])
            # event_types should be deduplicated
            self.assertEqual(summary["event_types"].count("event_a"), 1)

    def test_health_ai_ready_field_is_bool(self):
        with TestClient(main.app) as client:
            payload = client.get("/health").json()
            self.assertIsInstance(payload["ai_ready"], bool)

    def test_budget_status_fields(self):
        with TestClient(main.app) as client:
            payload = client.get("/budget/status").json()
            self.assertIn("current", payload)
            self.assertIn("limit", payload)
            self.assertIn("remaining", payload)
            self.assertGreaterEqual(payload["remaining"], 0)


if __name__ == "__main__":
    unittest.main()
