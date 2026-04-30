import json
import logging
from datetime import datetime, timezone
from .gcp_service import gcp_service

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        self.client = gcp_service.bigquery_client
        self.dataset = "electiq_analytics"
        self.table = "events"

    def write_event(self, event_name: str, session_id: str, page: str, props: dict):
        """Write an analytics event to BigQuery."""
        if not gcp_service.project_id:
            logger.info("Skipping BQ write: GOOGLE_CLOUD_PROJECT not set")
            return

        try:
            table_id = f"{gcp_service.project_id}.{self.dataset}.{self.table}"
            row = {
                "event_name": event_name,
                "session_id": session_id,
                "page": page,
                "props_json": json.dumps(props),
                "event_time": datetime.now(timezone.utc).isoformat(),
            }
            errors = self.client.insert_rows_json(table_id, [row])
            if errors:
                logger.warning(f"BigQuery insert errors: {errors}")
        except Exception as e:
            logger.warning(f"BigQuery write failed: {e}")

    def get_summary(self):
        """Read analytics summary from BigQuery for the dashboard."""
        if not gcp_service.project_id:
            return {"events_recorded": 0, "event_types": []}

        try:
            query = f"""
                SELECT event_name, COUNT(*) as count 
                FROM `{gcp_service.project_id}.{self.dataset}.{self.table}`
                GROUP BY event_name
                ORDER BY count DESC
            """
            query_job = self.client.query(query)
            results = query_job.result()
            
            summary = {
                "events_recorded": 0,
                "breakdown": {}
            }
            for row in results:
                summary["events_recorded"] += row.count
                summary["breakdown"][row.event_name] = row.count
            
            return summary
        except Exception as e:
            logger.warning(f"BigQuery read failed: {e}")
            return {"error": str(e)}

analytics_service = AnalyticsService()
