"""
Tests for service-layer modules: UsageLimiter, AIService fallbacks, GCPService.
"""
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("GEMINI_API_KEY", "unit-test-key")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "unit-test-project")


class UsageLimiterTests(unittest.TestCase):
    def setUp(self):
        """Create a fresh limiter for each test."""
        from app.services.usage_limiter import UsageLimiter
        self.limiter = UsageLimiter(limit=5)
        self.limiter.count = 0  # reset counter

    def test_allows_requests_under_limit(self):
        for _ in range(5):
            self.assertTrue(self.limiter.check_and_increment())

    def test_blocks_requests_at_limit(self):
        for _ in range(5):
            self.limiter.check_and_increment()
        self.assertFalse(self.limiter.check_and_increment())

    def test_get_status_shape(self):
        status = self.limiter.get_status()
        self.assertIn("current", status)
        self.assertIn("limit", status)
        self.assertIn("remaining", status)

    def test_remaining_decrements(self):
        initial = self.limiter.get_status()["remaining"]
        self.limiter.check_and_increment()
        after = self.limiter.get_status()["remaining"]
        self.assertEqual(after, initial - 1)

    def test_limit_is_configurable(self):
        from app.services.usage_limiter import UsageLimiter
        limiter = UsageLimiter(limit=10)
        self.assertEqual(limiter.limit, 10)


class AIServiceFallbackTests(unittest.TestCase):
    def test_generate_content_returns_empty_when_no_model(self):
        from app.services.ai_service import AIService
        svc = AIService.__new__(AIService)
        svc.model = None
        result = svc.generate_content("test prompt")
        self.assertEqual(result, "")

    def test_generate_chat_returns_string_when_no_model(self):
        from app.services.ai_service import AIService
        svc = AIService.__new__(AIService)
        svc.model = None
        result = svc.generate_chat_response("test prompt")
        self.assertIsInstance(result, str)
        self.assertIn("unavailable", result.lower())

    def test_usage_limiter_blocks_generate_content(self):
        from app.services.ai_service import AIService
        from app.services.usage_limiter import UsageLimiter
        svc = AIService.__new__(AIService)
        svc.model = MagicMock()
        svc.project_id = "test"

        mock_limiter = UsageLimiter(limit=0)
        mock_limiter.count = 0  # already at limit via check logic
        # Monkey-patch the limiter to always return False
        mock_limiter.check_and_increment = lambda: False

        import app.services.ai_service as ai_mod
        original = ai_mod.usage_limiter
        ai_mod.usage_limiter = mock_limiter
        result = svc.generate_content("test")
        ai_mod.usage_limiter = original

        self.assertIn("Budget", result)


class AnalyticsServiceTests(unittest.TestCase):
    def setUp(self):
        from app.services.analytics_service import analytics_service
        self.svc = analytics_service
        self.svc._events_mem.clear()

    def test_write_event_stores_in_memory(self):
        self.svc.write_event("test_event", "sess_001", "/chat", {"foo": "bar"})
        self.assertEqual(len(self.svc._events_mem), 1)
        self.assertEqual(self.svc._events_mem[0]["event_name"], "test_event")

    def test_get_summary_returns_correct_count(self):
        self.svc.write_event("click", "sess_001", "/home", {})
        self.svc.write_event("click", "sess_002", "/app", {})
        self.svc.write_event("page_view", "sess_001", "/chat", {})

        summary = self.svc.get_summary()
        self.assertEqual(summary["events_recorded"], 3)
        self.assertIn("click", summary["event_types"])
        self.assertIn("page_view", summary["event_types"])

    def test_get_summary_empty(self):
        summary = self.svc.get_summary()
        self.assertEqual(summary["events_recorded"], 0)

    def test_event_types_are_unique(self):
        for _ in range(5):
            self.svc.write_event("duplicate_event", "sess", "/", {})
        summary = self.svc.get_summary()
        self.assertEqual(summary["event_types"].count("duplicate_event"), 1)


if __name__ == "__main__":
    unittest.main()
