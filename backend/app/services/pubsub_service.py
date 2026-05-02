"""
Pub/Sub Service — Publishes events to Google Cloud Pub/Sub for async processing.

Used by the Jawaab Do accountability workflow to trigger background verification
after a citizen submits a report.
"""
import json
import logging
from typing import Any, Dict, Optional

from .gcp_service import gcp_service

logger = logging.getLogger(__name__)


class PubSubService:
    """Google Cloud Pub/Sub publisher wrapper."""

    def __init__(self) -> None:
        self.publisher = gcp_service.pubsub_publisher
        self.project_id: Optional[str] = gcp_service.project_id
        self.topic_id: str = "electiq-events"

    def publish_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Publish a structured event to the configured Pub/Sub topic.

        Args:
            event_type: Identifier for the event (e.g. 'accountability_report_submitted').
            data: Arbitrary event payload to be JSON-serialised.
        """
        if not self.project_id:
            logger.info("Skipping Pub/Sub publish: GOOGLE_CLOUD_PROJECT not set. Event: %s", event_type)
            return

        try:
            topic_path = self.publisher.topic_path(self.project_id, self.topic_id)
            message = {"event_type": event_type, "data": data}
            data_str = json.dumps(message).encode("utf-8")
            future = self.publisher.publish(topic_path, data_str)
            logger.info("Published event %s to %s: %s", event_type, self.topic_id, future.result())
        except Exception as e:
            logger.warning("Failed to publish to Pub/Sub: %s", e)


pubsub_service = PubSubService()
