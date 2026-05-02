"""
Usage Limiter — Budget guardrail to prevent GCP credit exhaustion.

Tracks AI request counts per container instance with thread-safe locking
and persistent state via /tmp so counts survive hot restarts.
"""
import json
import logging
import os
from threading import Lock
from typing import Any, Dict

logger = logging.getLogger(__name__)

_DEFAULT_LIMIT: int = 100
_COUNTER_FILE: str = "/tmp/usage_counter.json"


class UsageLimiter:
    """Thread-safe request counter with a configurable hard cap."""

    def __init__(self, limit: int = _DEFAULT_LIMIT) -> None:
        self.limit: int = limit
        self.count: int = 0
        self.lock: Lock = Lock()
        self.file_path: str = _COUNTER_FILE
        self._load()

    def _load(self) -> None:
        """Restore the counter from a previous container run."""
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r") as f:
                    data = json.load(f)
                    self.count = data.get("count", 0)
            except Exception:
                self.count = 0

    def _save(self) -> None:
        """Persist the current counter to disk."""
        try:
            with open(self.file_path, "w") as f:
                json.dump({"count": self.count}, f)
        except Exception:
            pass

    def check_and_increment(self) -> bool:
        """Atomically check the budget and increment the counter.

        Returns:
            ``True`` if the request is within budget; ``False`` if the limit
            has been reached.
        """
        with self.lock:
            if self.count >= self.limit:
                logger.warning("BUDGET LIMIT REACHED: %d/%d", self.count, self.limit)
                return False
            self.count += 1
            self._save()
            return True

    def get_status(self) -> Dict[str, Any]:
        """Return the current budget status as a JSON-serialisable dict."""
        return {
            "current": self.count,
            "limit": self.limit,
            "remaining": max(0, self.limit - self.count),
        }


# Global singleton — 100 requests hard cap for demo safety
usage_limiter = UsageLimiter(limit=_DEFAULT_LIMIT)
