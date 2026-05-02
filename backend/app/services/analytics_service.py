"""
Analytics Service — Event recording backed by BigQuery with in-memory fallback.

Events are always stored in-memory first (for reliable unit testing and
fast summary retrieval) and persisted to BigQuery as a durable backup
when a GCP project is configured.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from .gcp_service import gcp_service

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Analytics service with dual in-memory + BigQuery storage."""

    def __init__(self) -> None:
        self.client = gcp_service.bigquery_client
        self.dataset: str = "electiq_analytics"
        self.table: str = "events"
        # In-memory store — primary source for summary (BigQuery as durable backup).
        self._events_mem: List[Dict[str, Any]] = []

    def write_event(
        self,
        event_name: str,
        session_id: str,
        page: str,
        props: Dict[str, Any],
    ) -> None:
        """Record an analytics event (in-memory + BigQuery).

        Args:
            event_name: Event identifier (e.g. 'page_view', 'chat_start').
            session_id: Client session identifier.
            page: Page path where the event occurred.
            props: Arbitrary event properties.
        """
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
                logger.warning("BigQuery insert errors: %s", errors)
        except Exception as e:
            logger.warning("BigQuery write failed: %s", e)

    def get_summary(self) -> Dict[str, Any]:
        """Return analytics summary, preferring in-memory data when available.

        Returns:
            Dict with ``events_recorded`` (int) and ``event_types`` (list of
            unique event names).
        """
        if self._events_mem:
            event_types: List[str] = list({e["event_name"] for e in self._events_mem})
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
            event_types_bq: List[str] = []
            for row in results:
                total += row.count
                event_types_bq.append(row.event_name)

            return {"events_recorded": total, "event_types": event_types_bq}
        except Exception as e:
            logger.warning("BigQuery read failed: %s", e)
            return {"events_recorded": 0, "event_types": [], "error": str(e)}


analytics_service = AnalyticsService()
