"""
GCP Service — Centralised Google Cloud Platform client factory.

Provides lazy-initialised singleton clients for all GCP services used by
ElectIQ: Secret Manager, BigQuery, Vision AI, Pub/Sub, and Cloud Storage.
Clients are created on first access to avoid cold-start overhead when a
service is not needed by a particular request.
"""
import logging
import os
from typing import Optional

from google.cloud import bigquery, pubsub_v1, secretmanager, storage, vision

logger = logging.getLogger(__name__)


class GCPService:
    """Lazy-initialised factory for Google Cloud Platform service clients."""

    def __init__(self) -> None:
        self.project_id: Optional[str] = os.environ.get("GOOGLE_CLOUD_PROJECT")
        self._secret_client: Optional[secretmanager.SecretManagerServiceClient] = None
        self._bigquery_client: Optional[bigquery.Client] = None
        self._vision_client: Optional[vision.ImageAnnotatorClient] = None
        self._pubsub_publisher: Optional[pubsub_v1.PublisherClient] = None
        self._storage_client: Optional[storage.Client] = None

    # ── Lazy Properties ───────────────────────────────────────────────────────

    @property
    def secret_client(self) -> secretmanager.SecretManagerServiceClient:
        """Return the Secret Manager client, creating it on first access."""
        if not self._secret_client:
            self._secret_client = secretmanager.SecretManagerServiceClient()
        return self._secret_client

    @property
    def bigquery_client(self) -> bigquery.Client:
        """Return the BigQuery client, creating it on first access."""
        if not self._bigquery_client:
            self._bigquery_client = bigquery.Client(project=self.project_id)
        return self._bigquery_client

    @property
    def vision_client(self) -> vision.ImageAnnotatorClient:
        """Return the Vision AI client, creating it on first access."""
        if not self._vision_client:
            self._vision_client = vision.ImageAnnotatorClient()
        return self._vision_client

    @property
    def pubsub_publisher(self) -> pubsub_v1.PublisherClient:
        """Return the Pub/Sub publisher client, creating it on first access."""
        if not self._pubsub_publisher:
            self._pubsub_publisher = pubsub_v1.PublisherClient()
        return self._pubsub_publisher

    @property
    def storage_client(self) -> storage.Client:
        """Return the Cloud Storage client, creating it on first access."""
        if not self._storage_client:
            self._storage_client = storage.Client(project=self.project_id)
        return self._storage_client

    # ── Secret Access ─────────────────────────────────────────────────────────

    def get_secret(self, secret_id: str, version_id: str = "latest") -> Optional[str]:
        """Fetch a secret value from Google Cloud Secret Manager.

        Args:
            secret_id: The secret name (e.g. ``GEMINI_API_KEY``).
            version_id: The version to access (default ``latest``).

        Returns:
            The decoded secret string, or ``None`` if the project is not
            configured or the lookup fails.
        """
        if not self.project_id:
            return None
        try:
            name = f"projects/{self.project_id}/secrets/{secret_id}/versions/{version_id}"
            response = self.secret_client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8").strip()
        except Exception as e:
            logger.warning("Failed to fetch secret %s: %s", secret_id, e)
            return None


gcp_service = GCPService()
