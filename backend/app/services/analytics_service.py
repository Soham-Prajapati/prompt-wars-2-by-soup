import json
import logging
from datetime import datetime, timezone
from .gcp_service import gcp_service

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Analytics service backed by BigQuery with in-memory fallback for tests."""

    def __init__(self):
        self.client = gcp_service.bigquery_client
        self.dataset = "electiq_analytics"
        self.table = "events"
        # In-memory store used as primary source for summary (BigQuery as durable backup).
        self._events_mem: list = []

    def write_event(self, event_name: str, session_id: str, page: str, props: dict) -> None:
        """Record an analytics event (in-memory + BigQuery)."""
        self._events_mem.append({
            "event_name": event_name,
            "session_id": session_id,
            "page": page,
            "props": props,
            "event_time": datetime.now(timezone.utc).isoformat(),
        })

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

    def get_summary(self) -> dict:
        """Return analytics summary, preferring in-memory data when available."""
        if self._events_mem:
            event_types = list({e["event_name"] for e in self._events_mem})
            return {
                "events_recorded": len(self._events_mem),
                "event_types": event_types,
            }

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

            total = 0
            event_types = []
            for row in results:
                total += row.count
                event_types.append(row.event_name)

            return {"events_recorded": total, "event_types": event_types}
        except Exception as e:
            logger.warning(f"BigQuery read failed: {e}")
            return {"events_recorded": 0, "event_types": [], "error": str(e)}


analytics_service = AnalyticsService()
