"""Collectors package: editorial RSS (working), YouTube and eBay (stubs)."""

from .base import Collector, persist_observations
from .ebay import EbayCollector
from .rss import RSSCollector, run_ingest
from .youtube import YouTubeCollector

__all__ = [
    "Collector",
    "persist_observations",
    "RSSCollector",
    "run_ingest",
    "YouTubeCollector",
    "EbayCollector",
]
