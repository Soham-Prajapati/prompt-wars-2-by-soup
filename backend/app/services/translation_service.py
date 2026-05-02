"""
Translation Service — Multilingual output via Google Cloud Translation API.

Translates AI responses into any of India's 22 scheduled languages.
Uses lazy client initialization and an internal language-code map for
common Indian language names → ISO 639-1 codes.
"""
import logging
from typing import Any, Optional

from .gcp_service import gcp_service

logger = logging.getLogger(__name__)

# Common Indian language names → ISO 639-1 codes
_LANGUAGE_MAP: dict[str, str] = {
    "hindi": "hi",
    "marathi": "mr",
    "bengali": "bn",
    "tamil": "ta",
    "telugu": "te",
    "gujarati": "gu",
    "kannada": "kn",
    "malayalam": "ml",
    "punjabi": "pa",
    "odia": "or",
    "assamese": "as",
    "urdu": "ur",
}


class TranslationService:
    """Google Cloud Translation API v2 wrapper with language-name resolution."""

    def __init__(self) -> None:
        self._client: Any = None
        self.project_id: Optional[str] = gcp_service.project_id

    @property
    def client(self) -> Any:
        """Return the Translation client, creating it on first access."""
        if not self._client:
            from google.cloud import translate_v2 as translate
            self._client = translate.Client()
        return self._client

    def translate_text(self, text: str, target_language: str) -> str:
        """Translate text into the target language.

        Args:
            text: Source text to translate.
            target_language: Language name (e.g. ``Hindi``) or ISO code (e.g. ``hi``).

        Returns:
            Translated text, or the original text if translation is skipped
            or fails.
        """
        if not self.project_id:
            logger.info("Skipping Translation: GOOGLE_CLOUD_PROJECT not set. Target: %s", target_language)
            return text

        try:
            target = _LANGUAGE_MAP.get(target_language.lower(), target_language)

            if target == "en" or target_language.lower() == "english":
                return text

            result = self.client.translate(text, target_language=target)
            translated_text: str = result["translatedText"]
            logger.info("Translated to %s: %s...", target, translated_text[:50])
            return translated_text
        except Exception as e:
            logger.warning("Translation failed: %s", e)
            return text


translation_service = TranslationService()
