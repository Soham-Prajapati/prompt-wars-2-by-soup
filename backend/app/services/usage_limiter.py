import os
import json
import logging
from threading import Lock

logger = logging.getLogger(__name__)

class UsageLimiter:
    """
    Simple budget guardrail to prevent credit exhaustion.
    Limits total AI requests per container instance.
    """
    def __init__(self, limit=150):
        self.limit = limit
        self.count = 0
        self.lock = Lock()
        self.file_path = "/tmp/usage_counter.json"
        self._load()

    def _load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r") as f:
                    data = json.load(f)
                    self.count = data.get("count", 0)
            except Exception:
                self.count = 0

    def _save(self):
        try:
            with open(self.file_path, "w") as f:
                json.dump({"count": self.count}, f)
        except Exception:
            pass

    def check_and_increment(self) -> bool:
        with self.lock:
            if self.count >= self.limit:
                logger.warning(f"BUDGET LIMIT REACHED: {self.count}/{self.limit}")
                return False
            self.count += 1
            self._save()
            return True

    def get_status(self):
        return {"current": self.count, "limit": self.limit, "remaining": max(0, self.limit - self.count)}

# Global Singleton
usage_limiter = UsageLimiter(limit=100) # 100 requests hard cap for safety
