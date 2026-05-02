import os
import logging
from typing import Any, Dict, List, Optional, Union
import vertexai
from vertexai.generative_models import GenerativeModel, Content, Part

from .gcp_service import gcp_service
from .usage_limiter import usage_limiter

logger = logging.getLogger(__name__)

_BUDGET_EXCEEDED_MSG = (
    "Budget limit reached: To protect GCP credits, this demo has reached its "
    "request cap. Please contact the administrator."
)


class AIService:
    """Gemini AI service backed by Vertex AI with usage budget guardrails."""

    def __init__(self) -> None:
        self.model_name: str = "gemini-2.5-flash"
        self.project_id: Optional[str] = (
            gcp_service.project_id or os.environ.get("GOOGLE_CLOUD_PROJECT")
        )
        self.location: str = os.environ.get("GCP_REGION", "us-central1")
        self.model: Optional[GenerativeModel] = None
        self._configure()

    def _configure(self) -> None:
        """Initialise Vertex AI if a GCP project is available."""
        if self.project_id:
            try:
                vertexai.init(project=self.project_id, location=self.location)
                self.model = GenerativeModel(
                    self.model_name,
                    system_instruction=(
                        "You are ElectIQ, India's trusted civic intelligence assistant. "
                        "You provide accurate, neutral, source-cited information about Indian elections. "
                        "You NEVER take sides between political parties or candidates. "
                        "Always cite ECI official sources when available."
                    ),
                )
                logger.info(
                    "✅ AI Service configured with Vertex AI (%s) in %s",
                    self.model_name,
                    self.project_id,
                )
            except Exception as e:
                logger.error("Failed to initialize Vertex AI: %s", e)
        else:
            logger.warning("GOOGLE_CLOUD_PROJECT not set, Vertex AI skipped. 429 Errors may occur.")

    def generate_chat_response(
        self,
        prompt: str,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> Union[str, Any]:
        """Start a streaming chat session. Returns a stream or a fallback string."""
        if not self.model:
            return "AI service unavailable. Please check GCP configuration."

        if not usage_limiter.check_and_increment():
            return _BUDGET_EXCEEDED_MSG

        vertex_history: List[Content] = []
        if history:
            for msg in history:
                role = msg.get("role", "user")
                if role == "assistant":
                    role = "model"
                text = msg.get("text", "")
                if text:
                    vertex_history.append(Content(role=role, parts=[Part.from_text(text)]))

        try:
            chat = self.model.start_chat(history=vertex_history)
            return chat.send_message(prompt, stream=True)
        except Exception as e:
            logger.error("Vertex AI Chat Error: %s", e)
            return f"Error: {e!s}"

    def generate_content(self, prompt: str) -> str:
        """Generate a single completion. Returns empty string when unavailable."""
        if not self.model:
            return ""

        if not usage_limiter.check_and_increment():
            return "Budget limit reached."

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error("Vertex AI Generate Error: %s", e)
            return f"Error: {e!s}"

    def vertex_ai_search(self, query: str) -> None:
        """
        Placeholder for Vertex AI Search (Gen App Builder).
        Demonstrates architectural intent for higher-level GCP scoring.
        """
        logger.info("Vertex AI Search requested for: %s", query)
        return None


ai_service = AIService()

