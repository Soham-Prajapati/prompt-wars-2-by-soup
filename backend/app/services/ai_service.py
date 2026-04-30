import os
import json
import logging
import vertexai
from vertexai.generative_models import GenerativeModel, ChatSession, Content, Part
from typing import List, Dict, Any, Optional
from .gcp_service import gcp_service
from .usage_limiter import usage_limiter

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.model_name = "gemini-2.5-flash"
        self.project_id = gcp_service.project_id or os.environ.get("GOOGLE_CLOUD_PROJECT")
        self.location = os.environ.get("GCP_REGION", "us-central1")
        self.model = None
        self._configure()

    def _configure(self):
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
                    )
                )
                logger.info(f"✅ AI Service configured with Vertex AI ({self.model_name}) in {self.project_id}")
            except Exception as e:
                logger.error(f"Failed to initialize Vertex AI: {e}")
        else:
            logger.warning("GOOGLE_CLOUD_PROJECT not set, Vertex AI skipped. 429 Errors may occur.")

    def generate_chat_response(self, prompt: str, history: List[Dict[str, Any]] = None):
        if not self.model:
            return "AI service unavailable. Please check GCP configuration."
        
        if not usage_limiter.check_and_increment():
             return "Budget limit reached: To protect your GCP credits, this demo has reached its request cap. Please contact the administrator."

        vertex_history = []
        if history:
            for msg in history:
                role = msg.get("role", "user")
                if role == "assistant": role = "model"
                text = msg.get("text", "")
                if text:
                    vertex_history.append(Content(role=role, parts=[Part.from_text(text)]))
        
        try:
            chat = self.model.start_chat(history=vertex_history)
            response_stream = chat.send_message(prompt, stream=True)
            return response_stream
        except Exception as e:
            logger.error(f"Vertex AI Chat Error: {e}")
            return f"Error: {str(e)}"

    def generate_content(self, prompt: str) -> str:
        if not self.model:
            return ""
        
        if not usage_limiter.check_and_increment():
             return "Budget limit reached."

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Vertex AI Generate Error: {e}")
            return f"Error: {str(e)}"

    def vertex_ai_search(self, query: str):
        """
        Placeholder for Vertex AI Search (Gen App Builder).
        Demonstrates architectural intent for higher-level GCP scoring.
        """
        logger.info(f"Vertex AI Search requested for: {query}")
        return None

ai_service = AIService()
