import logging
from .gcp_service import gcp_service

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.client = gcp_service.storage_client
        self.bucket_name = f"{gcp_service.project_id}-evidence" if gcp_service.project_id else "electiq-evidence"

    def upload_file(self, content: bytes, filename: str, content_type: str = "image/jpeg"):
        """Upload a file to Google Cloud Storage."""
        if not gcp_service.project_id:
            logger.info(f"Skipping GCS upload: GOOGLE_CLOUD_PROJECT not set. File: {filename}")
            return None

        try:
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(filename)
            blob.upload_from_string(content, content_type=content_type)
            logger.info(f"Uploaded {filename} to {self.bucket_name}")
            return f"gs://{self.bucket_name}/{filename}"
        except Exception as e:
            logger.warning(f"Failed to upload to GCS: {e}")
            return None

storage_service = StorageService()
