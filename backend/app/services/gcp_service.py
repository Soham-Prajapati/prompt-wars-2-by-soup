import os
import logging
from typing import Optional
from google.cloud import secretmanager, bigquery, vision, pubsub_v1, storage

logger = logging.getLogger(__name__)

class GCPService:
    """Base service for managing Google Cloud Platform client initializations."""
    
    def __init__(self):
        self.project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
        self._secret_client = None
        self._bigquery_client = None
        self._vision_client = None
        self._pubsub_publisher = None
        self._storage_client = None

    @property
    def secret_client(self):
        if not self._secret_client:
            self._secret_client = secretmanager.SecretManagerServiceClient()
        return self._secret_client

    @property
    def bigquery_client(self):
        if not self._bigquery_client:
            self._bigquery_client = bigquery.Client(project=self.project_id)
        return self._bigquery_client

    @property
    def vision_client(self):
        if not self._vision_client:
            self._vision_client = vision.ImageAnnotatorClient()
        return self._vision_client

    @property
    def pubsub_publisher(self):
        if not self._pubsub_publisher:
            self._pubsub_publisher = pubsub_v1.PublisherClient()
        return self._pubsub_publisher

    @property
    def storage_client(self):
        if not self._storage_client:
            self._storage_client = storage.Client(project=self.project_id)
        return self._storage_client

    def get_secret(self, secret_id: str, version_id: str = "latest") -> Optional[str]:
        """Fetch a secret from Secret Manager."""
        if not self.project_id:
            return None
        try:
            name = f"projects/{self.project_id}/secrets/{secret_id}/versions/{version_id}"
            response = self.secret_client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8").strip()
        except Exception as e:
            logger.warning(f"Failed to fetch secret {secret_id}: {e}")
            return None

gcp_service = GCPService()
