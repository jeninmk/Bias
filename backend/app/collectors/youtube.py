"""YouTube collector: DOCUMENTED STUB (not yet implemented).

Plan (from ``docs/sources.md``): use the YouTube Data API v3 (free tier,
quota-limited) to search a fixed keyword list weekly for hauls, trend
roundups, and try-ons; view counts become volume, ``source_category``
is ``youtube``.

Access: one API key, read ONLY from the ``YOUTUBE_API_KEY`` environment
variable. No real API key exists for this project. Do not invent one
and do not put any key-like value anywhere. ``collect()`` raises a
clear error when the key is absent, and ``NotImplementedError`` until
the search implementation lands.
"""

from __future__ import annotations

import os

from ..engine.types import Observation as EngineObservation
from .base import Collector


class YouTubeCollector(Collector):
    source = "youtube"
    source_category = "youtube"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key if api_key is not None else os.environ.get("YOUTUBE_API_KEY", "")

    def collect(self) -> list[EngineObservation]:
        if not self.api_key:
            raise RuntimeError(
                "YouTube collector is not configured: set the YOUTUBE_API_KEY "
                "environment variable (YouTube Data API v3 key) to enable it."
            )
        raise NotImplementedError(
            "YouTube collector is a documented stub: the API-key check passed, "
            "but the search implementation (keyword list, view-count volume, "
            "sentiment) has not been built yet."
        )
