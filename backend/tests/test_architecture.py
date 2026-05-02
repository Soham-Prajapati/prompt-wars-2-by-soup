"""
Tests for newly extracted modules: config, exceptions, factcheck_service, security.

Validates the refactored architecture to ensure all extracted modules
maintain correctness after being separated from main.py.
"""
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("GEMINI_API_KEY", "unit-test-key")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "unit-test-project")


class TestSettings(unittest.TestCase):
    """Validates centralised configuration via pydantic-settings."""

    def test_settings_loads_defaults(self):
        from app.core.config import settings
        self.assertEqual(settings.app_title, "ElectIQ API")
        self.assertEqual(settings.app_version, "2.0.0")

    def test_cors_origins_list_parses_csv(self):
        from app.core.config import Settings
        s = Settings(cors_allow_origins="http://a.com, http://b.com")
        self.assertEqual(s.cors_origins_list, ["http://a.com", "http://b.com"])

    def test_wildcard_cors_detected(self):
        from app.core.config import Settings
        s = Settings(cors_allow_origins="*")
        self.assertTrue(s.is_wildcard_cors)

    def test_non_wildcard_cors(self):
        from app.core.config import Settings
        s = Settings(cors_allow_origins="http://localhost:3000")
        self.assertFalse(s.is_wildcard_cors)

    def test_bigquery_defaults(self):
        from app.core.config import settings
        self.assertEqual(settings.bigquery_dataset, "electiq_analytics")
        self.assertEqual(settings.bigquery_table, "events")

    def test_log_level_default(self):
        from app.core.config import settings
        self.assertEqual(settings.log_level, "INFO")


class TestCustomExceptions(unittest.TestCase):
    """Validates the custom exception hierarchy."""

    def test_base_error_has_defaults(self):
        from app.core.exceptions import ElectIQError
        err = ElectIQError()
        self.assertEqual(err.status_code, 500)
        self.assertEqual(err.error_code, "INTERNAL_ERROR")
        self.assertIn("internal", err.detail.lower())

    def test_ai_unavailable_error(self):
        from app.core.exceptions import AIServiceUnavailableError
        err = AIServiceUnavailableError()
        self.assertEqual(err.status_code, 503)
        self.assertEqual(err.error_code, "AI_UNAVAILABLE")

    def test_budget_exceeded_error(self):
        from app.core.exceptions import BudgetExceededError
        err = BudgetExceededError()
        self.assertEqual(err.status_code, 429)
        self.assertEqual(err.error_code, "BUDGET_EXCEEDED")

    def test_unsupported_media_error(self):
        from app.core.exceptions import UnsupportedMediaError
        err = UnsupportedMediaError("Bad file type")
        self.assertEqual(err.status_code, 415)
        self.assertEqual(err.detail, "Bad file type")

    def test_payload_too_large_error(self):
        from app.core.exceptions import PayloadTooLargeError
        err = PayloadTooLargeError("File too big")
        self.assertEqual(err.status_code, 413)
        self.assertEqual(err.error_code, "PAYLOAD_TOO_LARGE")

    def test_validation_error(self):
        from app.core.exceptions import ValidationError
        err = ValidationError("Invalid input")
        self.assertEqual(err.status_code, 422)

    def test_error_context_dict(self):
        from app.core.exceptions import ElectIQError
        err = ElectIQError("test", context={"field": "value"})
        self.assertEqual(err.context["field"], "value")

    def test_base_error_is_exception(self):
        from app.core.exceptions import ElectIQError
        self.assertTrue(issubclass(ElectIQError, Exception))

    def test_all_errors_inherit_base(self):
        from app.core.exceptions import (
            ElectIQError, AIServiceUnavailableError, BudgetExceededError,
            ValidationError, UnsupportedMediaError, PayloadTooLargeError,
        )
        for cls in [AIServiceUnavailableError, BudgetExceededError,
                    ValidationError, UnsupportedMediaError, PayloadTooLargeError]:
            self.assertTrue(issubclass(cls, ElectIQError))


class TestFactcheckService(unittest.TestCase):
    """Validates the extracted fact-check business logic."""

    def test_verify_claim_returns_unverifiable_without_model(self):
        from app.services.factcheck_service import verify_claim
        from app.services.ai_service import ai_service
        with patch.object(ai_service, "model", None):
            result = verify_claim("Test claim about elections", "English")
            self.assertEqual(result["overall_verdict"], "UNVERIFIABLE")
            self.assertIn("language", result)
            self.assertEqual(result["language"], "English")

    def test_verify_claim_returns_sources(self):
        from app.services.factcheck_service import verify_claim
        from app.services.ai_service import ai_service
        with patch.object(ai_service, "model", None):
            result = verify_claim("EVMs can be hacked", "Hindi")
            self.assertIn("sources_consulted", result)
            self.assertIsInstance(result["sources_consulted"], list)
            self.assertEqual(result["language"], "Hindi")

    def test_parse_json_response_valid(self):
        from app.services.factcheck_service import _parse_json_response
        text = 'Some prefix {"key": "value"} suffix'
        result = _parse_json_response(text)
        self.assertIsNotNone(result)
        self.assertEqual(result["key"], "value")

    def test_parse_json_response_invalid(self):
        from app.services.factcheck_service import _parse_json_response
        result = _parse_json_response("no json here")
        self.assertIsNone(result)

    def test_build_prompt_includes_claim(self):
        from app.services.factcheck_service import _build_prompt
        prompt = _build_prompt("Test claim", "English", "Some context")
        self.assertIn("Test claim", prompt)
        self.assertIn("English", prompt)
        self.assertIn("Some context", prompt)

    def test_build_prompt_handles_empty_context(self):
        from app.services.factcheck_service import _build_prompt
        prompt = _build_prompt("Test claim", "Hindi", "")
        self.assertIn("No specific context found", prompt)


class TestSecurityModule(unittest.TestCase):
    """Validates security constants are properly defined."""

    def test_csp_header_defined(self):
        from app.core.security import CSP_HEADER
        self.assertIn("default-src 'self'", CSP_HEADER)
        self.assertIn("frame-ancestors 'none'", CSP_HEADER)

    def test_csp_allows_google_fonts(self):
        from app.core.security import CSP_HEADER
        self.assertIn("fonts.googleapis.com", CSP_HEADER)
        self.assertIn("fonts.gstatic.com", CSP_HEADER)


class TestExceptionHandlerIntegration(unittest.TestCase):
    """Validates that the ElectIQ exception handler works in the app context."""

    def test_custom_error_returns_json(self):
        from fastapi.testclient import TestClient
        import app.main as main

        with TestClient(main.app) as client:
            response = client.get("/this-route-does-not-exist")
            self.assertEqual(response.status_code, 404)
            body = response.json()
            self.assertIn("detail", body)
            self.assertEqual(body["detail"], "Not found")


if __name__ == "__main__":
    unittest.main()
