"""
Vision AI Service — Analyses uploaded images for labels and safety.

Uses Google Cloud Vision API to extract labels and run safe-search detection
on evidence images uploaded through the Jawaab Do accountability workflow.
"""
import logging
from typing import Any, Dict, List

from google.cloud import vision

from .gcp_service import gcp_service

logger = logging.getLogger(__name__)


class VisionService:
    """Google Cloud Vision API wrapper for image analysis."""

    def __init__(self) -> None:
        self.client = gcp_service.vision_client

    def analyze_image(self, content: bytes) -> Dict[str, Any]:
        """Analyse an image for labels and safe-search classification.

        Args:
            content: Raw image bytes.

        Returns:
            Dict with ``labels`` (list of strings), ``is_safe`` (bool),
            and optional ``raw_safe_search`` details.
        """
        if not gcp_service.project_id:
            logger.info("Skipping Vision API: GOOGLE_CLOUD_PROJECT not set")
            return {"labels": [], "is_safe": True}

        try:
            image = vision.Image(content=content)

            # Label detection
            label_resp = self.client.label_detection(image=image)
            labels: List[str] = [
                label.description.lower() for label in label_resp.label_annotations
            ]

            # Safe search
            safe_resp = self.client.safe_search_detection(image=image)
            safe = safe_resp.safe_search_annotation

            is_safe: bool = all([
                safe.adult < 4,      # Below LIKELY threshold
                safe.violence < 4,
                safe.racy < 4,
            ])

            return {
                "labels": labels,
                "is_safe": is_safe,
                "raw_safe_search": {
                    "adult": safe.adult.name,
                    "violence": safe.violence.name,
                    "racy": safe.racy.name,
                },
            }
        except Exception as e:
            logger.warning("Vision API analysis failed: %s", e)
            return {"labels": [], "is_safe": True, "error": str(e)}


vision_service = VisionService()
