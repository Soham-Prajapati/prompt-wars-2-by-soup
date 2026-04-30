import json
import logging
from .gcp_service import gcp_service

logger = logging.getLogger(__name__)

class PubSubService:
    def __init__(self):
        self.publisher = gcp_service.pubsub_publisher
        self.project_id = gcp_service.project_id
        self.topic_id = "electiq-events"

    def publish_event(self, event_type: str, data: dict):
        """Publish an event to Pub/Sub for asynchronous processing."""
        if not self.project_id:
            logger.info(f"Skipping Pub/Sub publish: GOOGLE_CLOUD_PROJECT not set. Event: {event_type}")
            return
            
        try:
            topic_path = self.publisher.topic_path(self.project_id, self.topic_id)
            message = {
                "event_type": event_type,
                "data": data
            }
            data_str = json.dumps(message).encode("utf-8")
            future = self.publisher.publish(topic_path, data_str)
            logger.info(f"Published event {event_type} to {self.topic_id}: {future.result()}")
        except Exception as e:
            logger.warning(f"Failed to publish to Pub/Sub: {e}")

pubsub_service = PubSubService()
