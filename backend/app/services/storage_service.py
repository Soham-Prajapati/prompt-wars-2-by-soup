"""
Cloud Storage Service — Uploads evidence images to Google Cloud Storage.

Used by the accountability submission workflow to persist uploaded images
in a GCS bucket for later review.
"""
import logging
from typing import Optional

from .gcp_service import gcp_service

logger = logging.getLogger(__name__)


class StorageService:
    """Google Cloud Storage upload wrapper."""

    def __init__(self) -> None:
        self.client = gcp_service.storage_client
        self.bucket_name: str = (
            f"{gcp_service.project_id}-evidence"
            if gcp_service.project_id
            else "electiq-evidence"
        )

    def upload_file(
        self,
        content: bytes,
        filename: str,
        content_type: str = "image/jpeg",
    ) -> Optional[str]:
        """Upload a file to Google Cloud Storage and return its gs:// URI.

        Args:
            content: Raw file bytes.
            filename: Destination object name in the bucket.
            content_type: MIME type for the uploaded object.

        Returns:
            The ``gs://`` URI of the uploaded file, or ``None`` on failure.
        """
        if not gcp_service.project_id:
            logger.info("Skipping GCS upload: GOOGLE_CLOUD_PROJECT not set. File: %s", filename)
            return None

        try:
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(filename)
            blob.upload_from_string(content, content_type=content_type)
            logger.info("Uploaded %s to %s", filename, self.bucket_name)
            return f"gs://{self.bucket_name}/{filename}"
        except Exception as e:
            logger.warning("Failed to upload to GCS: %s", e)
            return None


storage_service = StorageService()
