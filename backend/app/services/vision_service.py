import logging
from google.cloud import vision
from .gcp_service import gcp_service

logger = logging.getLogger(__name__)

class VisionService:
    def __init__(self):
        self.client = gcp_service.vision_client

    def analyze_image(self, content: bytes):
        """Analyze an image for safe search and labels."""
        if not gcp_service.project_id:
            logger.info("Skipping Vision API: GOOGLE_CLOUD_PROJECT not set")
            return {"labels": [], "safe": True}

        try:
            image = vision.Image(content=content)
            
            # Label detection
            label_resp = self.client.label_detection(image=image)
            labels = [l.description.lower() for l in label_resp.label_annotations]

            # Safe search
            safe_resp = self.client.safe_search_detection(image=image)
            safe = safe_resp.safe_search_annotation
            
            # Simplified safe check
            is_safe = all([
                safe.adult < 4,      # LIKELY
                safe.violence < 4,
                safe.racy < 4
            ])

            return {
                "labels": labels,
                "is_safe": is_safe,
                "raw_safe_search": {
                    "adult": safe.adult.name,
                    "violence": safe.violence.name,
                    "racy": safe.racy.name
                }
            }
        except Exception as e:
            logger.warning(f"Vision API analysis failed: {e}")
            return {"labels": [], "is_safe": True, "error": str(e)}

vision_service = VisionService()
