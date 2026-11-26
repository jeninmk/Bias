"""eBay collector: DOCUMENTED STUB (not yet implemented).

Plan (from ``docs/sources.md``): eBay is the one automatable resale
source. The eBay Browse API (approved developer app) returns sold
listings per search keyword; sold prices and sell-through give real
price evidence (``price.avg_resale_price`` / ``sell_through_rate``)
with ``source_category`` ``resale``. Depop / ThredUp / Vinted block
scraping, so eBay is the resale collector.

Access: OAuth client credentials, read ONLY from the
``EBAY_CLIENT_ID`` and ``EBAY_CLIENT_SECRET`` environment variables.
No real credentials exist for this project. Do not invent any and do
not put any key-like value anywhere. ``collect()`` raises a clear error
when the credentials are absent, and ``NotImplementedError`` until the
Browse API implementation lands.
"""

from __future__ import annotations

import os

from ..engine.types import Observation as EngineObservation
from .base import Collector


class EbayCollector(Collector):
    source = "ebay"
    source_category = "resale"

    def __init__(
        self,
        client_id: str | None = None,
        client_secret: str | None = None,
    ):
        self.client_id = (
            client_id if client_id is not None else os.environ.get("EBAY_CLIENT_ID", "")
        )
        self.client_secret = (
            client_secret
            if client_secret is not None
            else os.environ.get("EBAY_CLIENT_SECRET", "")
        )

    def collect(self) -> list[EngineObservation]:
        if not self.client_id or not self.client_secret:
            raise RuntimeError(
                "eBay collector is not configured: set the EBAY_CLIENT_ID and "
                "EBAY_CLIENT_SECRET environment variables (eBay Browse API "
                "client credentials) to enable it."
            )
        raise NotImplementedError(
            "eBay collector is a documented stub: the credential check passed, "
            "but the Browse API implementation (sold-listing search, price "
            "and sell-through extraction) has not been built yet."
        )
