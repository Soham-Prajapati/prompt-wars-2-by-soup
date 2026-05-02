"""
Tests for civic data endpoints: /timeline, /evm-data, /quiz, /accountability/promises
"""
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


class CivicDataTests(unittest.TestCase):
    def test_timeline_shape(self):
        with TestClient(main.app) as client:
            response = client.get("/timeline")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertIn("phases", payload)
            self.assertIn("key_stats", payload)
            self.assertIsInstance(payload["phases"], list)
            self.assertGreater(len(payload["phases"]), 0)

    def test_timeline_phases_have_required_fields(self):
        with TestClient(main.app) as client:
            response = client.get("/timeline")
            phases = response.json()["phases"]
            for phase in phases:
                self.assertIn("name", phase)
                self.assertIn("date", phase)

    def test_evm_data_shape(self):
        with TestClient(main.app) as client:
            response = client.get("/evm-data")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertIn("candidates", payload)
            self.assertIn("evm_facts", payload)
            self.assertIn("evm_model", payload)
            self.assertIsInstance(payload["candidates"], list)
            self.assertGreater(len(payload["candidates"]), 0)

    def test_evm_candidates_have_required_fields(self):
        with TestClient(main.app) as client:
            response = client.get("/evm-data")
            candidates = response.json()["candidates"]
            for c in candidates:
                self.assertIn("id", c)
                self.assertIn("name", c)
                self.assertIn("party", c)

    def test_accountability_promises_no_filter(self):
        with TestClient(main.app) as client:
            response = client.get("/accountability/promises")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertIn("promises", payload)
            self.assertIn("total", payload)
            self.assertGreater(payload["total"], 0)

    def test_accountability_promises_with_filter(self):
        with TestClient(main.app) as client:
            response = client.get("/accountability/promises?q=Infrastructure")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertIn("promises", payload)
            for p in payload["promises"]:
                self.assertIn("Infrastructure", p["category"])

    def test_accountability_promises_empty_filter(self):
        with TestClient(main.app) as client:
            response = client.get("/accountability/promises?q=XYZNONEXISTENT99")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertEqual(payload["total"], 0)

    def test_accountability_reports_endpoint(self):
        with TestClient(main.app) as client:
            response = client.get("/accountability/reports")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertIn("reports", payload)

    def test_root_endpoint(self):
        with TestClient(main.app) as client:
            response = client.get("/")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertEqual(payload["product"], "ElectIQ")
            self.assertIn("google_services", payload)
            self.assertIn("version", payload)

    def test_budget_status_endpoint(self):
        with TestClient(main.app) as client:
            response = client.get("/budget/status")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertIn("current", payload)
            self.assertIn("limit", payload)
            self.assertIn("remaining", payload)

    def test_google_services_live_proof(self):
        with TestClient(main.app) as client:
            response = client.get("/google-services/live-proof")
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertIn("status", payload)
            self.assertIn("services", payload)


if __name__ == "__main__":
    unittest.main()
