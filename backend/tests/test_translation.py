"""
Tests for TranslationService — language map, passthrough, and fallback.
"""
import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("GEMINI_API_KEY", "unit-test-key")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "unit-test-project")

from app.services.translation_service import TranslationService, _LANGUAGE_MAP


class TestLanguageMap:
    """Language map must cover major Indian languages."""

    def test_hindi_maps_to_hi(self):
        assert _LANGUAGE_MAP["hindi"] == "hi"

    def test_tamil_maps_to_ta(self):
        assert _LANGUAGE_MAP["tamil"] == "ta"

    def test_bengali_maps_to_bn(self):
        assert _LANGUAGE_MAP["bengali"] == "bn"

    def test_all_values_are_two_letter_codes(self):
        for name, code in _LANGUAGE_MAP.items():
            assert len(code) == 2, f"{name} mapped to non-2-letter code: {code}"


class TestTranslationPassthrough:
    """English input must be returned without API call."""

    def test_english_returns_original(self):
        svc = TranslationService()
        result = svc.translate_text("Hello world", "English")
        assert result == "Hello world"

    def test_en_code_returns_original(self):
        svc = TranslationService()
        result = svc.translate_text("Hello world", "en")
        assert result == "Hello world"


class TestTranslationFallback:
    """When project_id is not set, translation falls back to original text."""

    def test_no_project_returns_original(self):
        svc = TranslationService()
        svc.project_id = None
        result = svc.translate_text("Test text", "Hindi")
        assert result == "Test text"
