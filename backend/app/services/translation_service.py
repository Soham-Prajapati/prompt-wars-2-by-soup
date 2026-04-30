import logging
from .gcp_service import gcp_service

logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        self._client = None
        self.project_id = gcp_service.project_id

    @property
    def client(self):
        if not self._client:
            from google.cloud import translate_v2 as translate
            self._client = translate.Client()
        return self._client

    def translate_text(self, text: str, target_language: str) -> str:
        """Translate text using Google Cloud Translation API."""
        if not self.project_id:
            logger.info(f"Skipping Translation: GOOGLE_CLOUD_PROJECT not set. Target: {target_language}")
            return text

        try:
            # Map common names to ISO codes if needed
            lang_map = {
                "hindi": "hi",
                "marathi": "mr",
                "bengali": "bn",
                "tamil": "ta",
                "telugu": "te",
                "gujarati": "gu",
                "kannada": "kn",
                "malayalam": "ml",
                "punjabi": "pa",
            }
            target = lang_map.get(target_language.lower(), target_language)
            
            if target == "en" or target_language.lower() == "english":
                return text

            result = self.client.translate(text, target_language=target)
            translated_text = result["translatedText"]
            logger.info(f"Translated to {target}: {translated_text[:50]}...")
            return translated_text
        except Exception as e:
            logger.warning(f"Translation failed: {e}")
            return text

translation_service = TranslationService()
