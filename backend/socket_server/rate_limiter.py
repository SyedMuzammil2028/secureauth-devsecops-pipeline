# rate_limiter placeholder
import time
from collections import defaultdict, deque
from backend.common.config import settings


class InMemoryRateLimiter:
    def __init__(self):
        self.requests = defaultdict(deque)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        window = settings.RATE_LIMIT_WINDOW_SECONDS
        max_requests = settings.RATE_LIMIT_MAX_REQUESTS

        bucket = self.requests[key]

        while bucket and (now - bucket[0]) > window:
            bucket.popleft()

        if len(bucket) >= max_requests:
            return False

        bucket.append(now)
        return True


rate_limiter = InMemoryRateLimiter()