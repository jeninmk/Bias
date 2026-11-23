"""Common collector interface.

Every collector yields engine ``Observation`` objects (pure data, no DB
writes inside ``collect``) and shares ``persist_observations`` to write
a batch to the DB, record an ``IngestionRun``, and recompute scores.
"""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..engine.score import parse_timestamp
from ..engine.types import Observation as EngineObservation
from ..models import IngestionRun, Observation as ObservationRow
from ..seed import compute_and_store_scores


class Collector(ABC):
    """One source of observations (one feed, API, or scrape)."""

    #: short id used in IngestionRun.source, e.g. "rss", "youtube", "ebay".
    source: str = "unknown"
    #: source category the observations belong to, e.g. "editorial".
    source_category: str = "editorial"

    @abstractmethod
    def collect(self) -> list[EngineObservation]:
        """Fetch new observations. Pure fetch: no DB writes here."""
        raise NotImplementedError

    def run_ingest(self, db: Session) -> dict:
        """Collect, persist, recompute scores, record the run."""
        run = IngestionRun(
            source=self.source,
            started_at=datetime.now(timezone.utc),
            observations_added=0,
            status="running",
        )
        db.add(run)
        db.commit()
        try:
            observations = self.collect()
            added = persist_observations(db, observations)
            run.observations_added = added
            run.status = "success"
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
            return {
                "source": self.source,
                "observations_added": added,
                "status": "success",
            }
        except Exception as exc:  # noqa: BLE001 - record the failure on the run
            db.rollback()
            run.status = "failed"
            run.error = str(exc)
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
            raise


def persist_observations(db: Session, observations: list[EngineObservation]) -> int:
    """Insert (or upsert by id) a batch of observations, then recompute
    and store trend scores over ALL observations in the DB.

    Returns the number of observations written.
    """
    for eo in observations:
        db.merge(
            ObservationRow(
                id=eo.id or f"obs-{uuid.uuid4().hex[:12]}",
                attribute=eo.attribute,
                attribute_type=eo.attribute_type,
                canonical_attribute=eo.canonical_attribute,
                source=eo.source,
                source_category=eo.source_category,
                timestamp=parse_timestamp(eo.timestamp),
                volume=eo.volume,
                sentiment=eo.sentiment,
                price=(
                    {
                        "avg_resale_price": eo.price.avg_resale_price,
                        "retail_price": eo.price.retail_price,
                        "sold_count": eo.price.sold_count,
                        "sell_through_rate": eo.price.sell_through_rate,
                    }
                    if eo.price
                    else None
                ),
            )
        )
    db.commit()
    rows = db.query(ObservationRow).all()
    engine_obs = [
        EngineObservation(
            id=r.id,
            attribute=r.attribute,
            attribute_type=r.attribute_type,
            canonical_attribute=r.canonical_attribute,
            source=r.source,
            source_category=r.source_category,
            timestamp=r.timestamp.isoformat(),
            volume=r.volume,
            sentiment=r.sentiment,
        )
        for r in rows
    ]
    if engine_obs:
        compute_and_store_scores(db, engine_obs)
    return len(observations)
