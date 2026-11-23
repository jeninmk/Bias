"""Seed loader: loads ``src/data/seed-observations.json`` into the DB
and computes/stores trend scores.

Usage:
    python scripts/seed_db.py            # from backend/
    python -m app.seed                   # same, as a module

Idempotent: re-running replaces the seed observations (matched by id)
and recomputes all scores.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from .db import SessionLocal, init_db
from .engine.score import parse_timestamp, score_trends
from .engine.types import Observation as EngineObservation, PriceData
from .models import IngestionRun, Observation, TrendScore

SEED_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "src"
    / "data"
    / "seed-observations.json"
)


def load_seed_observations(path: Path = SEED_PATH) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"expected a JSON list in {path}")
    return data


def _engine_observation(raw: dict) -> EngineObservation:
    price = raw.get("price")
    return EngineObservation(
        id=raw["id"],
        attribute=raw["attribute"],
        attribute_type=raw["attributeType"],
        canonical_attribute=raw["canonicalAttribute"],
        source=raw["source"],
        source_category=raw["sourceCategory"],
        timestamp=raw["timestamp"],
        volume=raw["volume"],
        sentiment=raw["sentiment"],
        price=PriceData(
            avg_resale_price=price.get("avgResalePrice"),
            retail_price=price.get("retailPrice"),
            sold_count=price.get("soldCount"),
            sell_through_rate=price.get("sellThroughRate"),
        )
        if price
        else None,
    )


def compute_and_store_scores(db: Session, engine_obs: list[EngineObservation]) -> list:
    """Score all trends as of the freshest observation and store the rows.

    Mirrors the TS engine: windows anchor to the freshest week present
    and recency decay is computed vs the scoring date, which is the max
    timestamp in the data.
    """
    as_of = max(parse_timestamp(o.timestamp) for o in engine_obs)
    scored = score_trends(engine_obs, as_of)
    now = datetime.now(timezone.utc)
    db.query(TrendScore).delete()
    for t in scored:
        db.add(
            TrendScore(
                canonical_attribute=t.canonical_attribute,
                attribute_type=t.attribute_type,
                trend_score=t.score.trend_score,
                velocity=t.score.velocity,
                volume=t.score.volume,
                breadth=t.score.breadth,
                sentiment=t.score.sentiment,
                resale=t.score.resale,
                authority=t.score.authority,
                confidence=t.score.confidence,
                stage=t.stage,
                observation_count=t.observation_count,
                total_volume=t.total_volume,
                latest_week_volume=t.latest_week_volume,
                previous_week_volume=t.previous_week_volume,
                velocity_rate=t.velocity_rate,
                acceleration_rate=t.acceleration_rate,
                relative_volume=t.relative_volume,
                source_categories=t.source_categories,
                weeks_to_peak=t.forecast.weeks_to_peak,
                peak_window_start_weeks=t.forecast.peak_window_start_weeks,
                peak_window_end_weeks=t.forecast.peak_window_end_weeks,
                estimated_peak_score=t.forecast.estimated_peak_score,
                computed_at=now,
            )
        )
    db.commit()
    return scored


def seed_db(db: Session, path: Path = SEED_PATH) -> dict:
    """Load the seed file into the DB and compute scores. Returns counts."""
    raw = load_seed_observations(path)
    run = IngestionRun(
        source="seed",
        started_at=datetime.now(timezone.utc),
        observations_added=0,
        status="running",
    )
    db.add(run)
    db.commit()
    try:
        engine_obs: list[EngineObservation] = []
        added = 0
        for raw_obs in raw:
            eo = _engine_observation(raw_obs)
            engine_obs.append(eo)
            price = raw_obs.get("price")
            db.merge(
                Observation(
                    id=eo.id,
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
                            "avg_resale_price": price.get("avgResalePrice"),
                            "retail_price": price.get("retailPrice"),
                            "sold_count": price.get("soldCount"),
                            "sell_through_rate": price.get("sellThroughRate"),
                        }
                        if price
                        else None
                    ),
                )
            )
            added += 1
        db.commit()
        scored = compute_and_store_scores(db, engine_obs)
        run.observations_added = added
        run.status = "success"
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
        return {
            "observations_added": added,
            "trends_scored": len(scored),
            "status": "success",
        }
    except Exception as exc:  # noqa: BLE001 - record the failure on the run
        db.rollback()
        run.status = "failed"
        run.error = str(exc)
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
        raise


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        result = seed_db(db)
        print(
            f"Seeded {result['observations_added']} observations, "
            f"scored {result['trends_scored']} trends."
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
