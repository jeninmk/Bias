"""Bias API — FastAPI app serving scored fashion trends from the DB.

Endpoints:
    GET  /health               liveness check
    GET  /api/trends           ranked list of trends (from stored scores)
    GET  /api/trends/{slug}    one trend: score breakdown, forecast,
                               weekly volumes, per-source breakdown
    GET  /api/colors           color trends with palette data
    GET  /api/methodology      the formula, signals, and lifecycle stages
    POST /api/ingest/rss       run the editorial RSS collector
                               (header ``X-Ingest-Key``, see README)

If the DB is empty, /api/trends returns an empty list with a clear
message, not an error.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from . import config
from .collectors.rss import RSSCollector
from .db import get_db, init_db
from .engine import (
    AUTHORITY_CATEGORIES,
    RECENT_WINDOW_WEEKS,
    RECENCY_HALF_LIFE_DAYS,
    SOURCE_CATEGORIES,
    SOURCE_CATEGORY_COUNT,
    TYPICAL_LIFECYCLE_WEEKS,
    VELOCITY_WINDOW_WEEKS,
    latest_week_start,
    weekly_volumes_chronological,
)
from .engine.types import Observation as EngineObservation
from .models import Observation as ObservationRow, TrendScore
from .schemas import (
    ColorTrendOut,
    ForecastOut,
    IngestOut,
    SourceBreakdownOut,
    TrendDetailOut,
    TrendOut,
    TrendScoreOut,
    TrendsListOut,
    WeeklyVolumeOut,
)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{config.RATE_LIMIT_PER_MINUTE} per minute"],
)

app = FastAPI(title="Bias — Fashion Trend Forecasting API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(canonical: str) -> str:
    return canonical.strip().lower().replace(" ", "-")


# Hex palettes for the known color trends (representative swatches).
COLOR_PALETTES: dict[str, list[str]] = {
    "oxblood": ["#4A0E0E", "#6B1A1A", "#7F1D1D", "#9B2C2C", "#B03A2E"],
    "chocolate brown": ["#3B2314", "#5C3A21", "#7B4B2A", "#8B5E3C", "#A67C52"],
    "butter yellow": ["#F5E6A3", "#F9E784", "#FDE68A", "#FEF3C7", "#FFF7CC"],
    "navy": ["#0A1931", "#12294D", "#1E3A5F", "#2C4A73", "#3D5A80"],
    "forest green": ["#0B3D2E", "#14532D", "#1E6B3A", "#2D7A4F", "#4C956C"],
}


def _trend_out(row: TrendScore) -> TrendOut:
    return TrendOut(
        canonical_attribute=row.canonical_attribute,
        attribute_type=row.attribute_type,
        score=TrendScoreOut(
            trend_score=row.trend_score,
            velocity=row.velocity,
            volume=row.volume,
            breadth=row.breadth,
            sentiment=row.sentiment,
            resale=row.resale,
            authority=row.authority,
            confidence=row.confidence,
        ),
        stage=row.stage,
        observation_count=row.observation_count,
        source_categories=list(row.source_categories or []),
        total_volume=row.total_volume,
        latest_week_volume=row.latest_week_volume,
        previous_week_volume=row.previous_week_volume,
        velocity_rate=row.velocity_rate,
        acceleration_rate=row.acceleration_rate,
        relative_volume=row.relative_volume,
        forecast=ForecastOut(
            weeks_to_peak=row.weeks_to_peak,
            peak_window_start_weeks=row.peak_window_start_weeks,
            peak_window_end_weeks=row.peak_window_end_weeks,
            estimated_peak_score=row.estimated_peak_score,
        ),
        computed_at=row.computed_at,
    )


def _engine_observations(db: Session, canonical: str | None = None) -> list[EngineObservation]:
    query = db.query(ObservationRow)
    if canonical is not None:
        query = query.filter(ObservationRow.canonical_attribute == canonical)
    return [
        EngineObservation(
            id=r.id,
            attribute=r.attribute,
            attribute_type=r.attribute_type,
            canonical_attribute=r.canonical_attribute,
            source=r.source,
            source_category=r.source_category,
            timestamp=(
                r.timestamp.isoformat()
                if isinstance(r.timestamp, datetime)
                else str(r.timestamp)
            ),
            volume=r.volume,
            sentiment=r.sentiment,
        )
        for r in query.all()
    ]


def _find_trend_row(db: Session, slug: str) -> TrendScore:
    rows = db.query(TrendScore).all()
    for row in rows:
        if slugify(row.canonical_attribute) == slug.lower():
            return row
    raise HTTPException(status_code=404, detail=f"no trend found for slug '{slug}'")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/trends", response_model=TrendsListOut)
@limiter.limit(f"{config.RATE_LIMIT_PER_MINUTE} per minute")
def list_trends(request: Request, db: Session = Depends(get_db)):
    rows = (
        db.query(TrendScore)
        .order_by(TrendScore.trend_score.desc(), TrendScore.canonical_attribute)
        .all()
    )
    if not rows:
        return TrendsListOut(
            trends=[],
            count=0,
            message=(
                "No trend data yet. Seed the database with "
                "`python scripts/seed_db.py` (see README.md)."
            ),
        )
    return TrendsListOut(trends=[_trend_out(r) for r in rows], count=len(rows))


@app.get("/api/trends/{slug}", response_model=TrendDetailOut)
@limiter.limit(f"{config.RATE_LIMIT_PER_MINUTE} per minute")
def trend_detail(request: Request, slug: str, db: Session = Depends(get_db)):
    row = _find_trend_row(db, slug)
    base = _trend_out(row)

    observations = _engine_observations(db, canonical=row.canonical_attribute)
    weekly: list[WeeklyVolumeOut] = []
    breakdown: list[SourceBreakdownOut] = []
    if observations:
        all_obs = _engine_observations(db)
        anchor = latest_week_start(all_obs)
        weekly = [
            WeeklyVolumeOut(week=w["key"], volume=w["volume"])
            for w in weekly_volumes_chronological(
                observations, anchor, VELOCITY_WINDOW_WEEKS
            )
        ]
        total_volume = sum(o.volume for o in observations)
        by_category: dict[str, list[EngineObservation]] = {}
        for o in observations:
            by_category.setdefault(o.source_category, []).append(o)
        for category, obs in sorted(by_category.items()):
            vol = sum(o.volume for o in obs)
            sent_vol = sum(o.volume for o in obs)
            avg_sent = (
                sum(o.sentiment * o.volume for o in obs) / sent_vol
                if sent_vol > 0
                else 0.0
            )
            breakdown.append(
                SourceBreakdownOut(
                    category=category,
                    sources=sorted({o.source for o in obs}),
                    observation_count=len(obs),
                    volume=vol,
                    volume_share=vol / total_volume if total_volume > 0 else 0.0,
                    avg_sentiment=avg_sent,
                )
            )

    return TrendDetailOut(**base.model_dump(), weekly_volumes=weekly, source_breakdown=breakdown)


@app.get("/api/colors", response_model=list[ColorTrendOut])
@limiter.limit(f"{config.RATE_LIMIT_PER_MINUTE} per minute")
def list_colors(request: Request, db: Session = Depends(get_db)):
    rows = (
        db.query(TrendScore)
        .filter(TrendScore.attribute_type == "color")
        .order_by(TrendScore.trend_score.desc(), TrendScore.canonical_attribute)
        .all()
    )
    return [
        ColorTrendOut(
            canonical_attribute=r.canonical_attribute,
            attribute_type=r.attribute_type,
            score=TrendScoreOut(
                trend_score=r.trend_score,
                velocity=r.velocity,
                volume=r.volume,
                breadth=r.breadth,
                sentiment=r.sentiment,
                resale=r.resale,
                authority=r.authority,
                confidence=r.confidence,
            ),
            stage=r.stage,
            palette=COLOR_PALETTES.get(r.canonical_attribute, []),
            computed_at=r.computed_at,
        )
        for r in rows
    ]


@app.get("/api/methodology")
@limiter.limit(f"{config.RATE_LIMIT_PER_MINUTE} per minute")
def methodology(request: Request):
    return {
        "formula": (
            "Trend Score = 0.30*velocity + 0.20*volume + 0.20*breadth "
            "+ 0.10*sentiment + 0.10*resale + 0.10*authority"
        ),
        "weights": {
            "velocity": 0.30,
            "volume": 0.20,
            "breadth": 0.20,
            "sentiment": 0.10,
            "resale": 0.10,
            "authority": 0.10,
        },
        "signals": [
            {
                "name": "velocity",
                "definition": "Week-over-week growth of the latest complete week (raw weekly volumes).",
                "normalization": "clamp(50 + growth_rate * 100, 0, 100): 0% growth scores 50, +50% scores 100, -50% scores 0.",
            },
            {
                "name": "volume",
                "definition": "Recency-decayed total volume (14-day half-life exponential decay).",
                "normalization": "100 * ln(1 + decayed_total) / ln(1 + max_decayed_total): log scale vs the highest-volume trend.",
            },
            {
                "name": "breadth",
                "definition": "Distinct source categories observing the trend in the last 4 weeks.",
                "normalization": "distinct_categories / 17 * 100.",
            },
            {
                "name": "sentiment",
                "definition": "Volume-weighted average sentiment over the last 4 weeks.",
                "normalization": "((avg_sentiment + 1) / 2) * 100, mapping [-1, 1] to [0, 100].",
            },
            {
                "name": "resale",
                "definition": "Resale price premium vs retail blended with sell-through rate.",
                "normalization": "0.6 * clamp(50 + avg_premium * 100) + 0.4 * (sell_through_rate * 100); 50 (neutral) when no resale data exists.",
            },
            {
                "name": "authority",
                "definition": "Share of recent (4-week) volume from runway, editorial, and color-authority sources.",
                "normalization": "clamp(authority_volume_share * 200, 0, 100).",
            },
            {
                "name": "confidence",
                "definition": "Trust in the score from observation count and source diversity.",
                "normalization": "0.5 * min(100, observation_count / 25 * 100) + 0.5 * (distinct_categories / 17 * 100).",
            },
        ],
        "recency": {
            "half_life_days": RECENCY_HALF_LIFE_DAYS,
            "formula": "weight = 0.5 ^ (age_days / 14)",
            "note": "Decay applies to volume, sentiment, and authority. Velocity uses raw weekly volumes.",
        },
        "windows": {
            "velocity_window_weeks": VELOCITY_WINDOW_WEEKS,
            "recent_window_weeks": RECENT_WINDOW_WEEKS,
            "note": "Weekly windows anchor to the freshest week present in the data, so the latest complete week is never an empty future week.",
        },
        "lifecycle_stages": [
            {"stage": "emerging", "rule": "relative_volume < 0.35, velocity_rate > 0.25, breadth <= 5"},
            {"stage": "rising", "rule": "positive velocity, growing volume and breadth (default)"},
            {"stage": "peak", "rule": "relative_volume >= 0.6 and |velocity_rate| <= 0.15"},
            {"stage": "declining", "rule": "velocity_rate <= -0.15"},
            {"stage": "dead", "rule": "relative_volume <= 0.12 and velocity_rate <= -0.20"},
        ],
        "typical_lifecycle_weeks": TYPICAL_LIFECYCLE_WEEKS,
        "forecast": {
            "formula": "weeks_to_peak = typical_lifecycle_weeks * (1 - relative_volume), clamped to 1-12; peak trends are ~1 week out",
            "peak_window_weeks": "3 for color and aesthetic, 2 for other types",
            "estimated_peak_score": "trend_score * (1 + max(0, velocity_rate) * 0.25), capped at 100; declining/dead trends have already peaked (0 weeks)",
        },
        "source_categories": SOURCE_CATEGORIES,
        "source_category_count": SOURCE_CATEGORY_COUNT,
        "authority_categories": AUTHORITY_CATEGORIES,
    }


@app.post("/api/ingest/rss", response_model=IngestOut)
@limiter.limit("10 per minute")
def ingest_rss(
    request: Request,
    x_ingest_key: str | None = Header(default=None, alias="X-Ingest-Key"),
    db: Session = Depends(get_db),
):
    """Run the editorial RSS collector.

    Protected by a shared secret: send header ``X-Ingest-Key`` with the
    ``INGEST_KEY`` env value. GitHub Actions calls this endpoint on a
    schedule to keep the editorial signal fresh.
    """
    if not config.INGEST_KEY:
        raise HTTPException(
            status_code=503,
            detail="ingestion is not configured: set the INGEST_KEY environment variable",
        )
    if x_ingest_key != config.INGEST_KEY:
        raise HTTPException(status_code=401, detail="invalid or missing X-Ingest-Key")
    try:
        result = RSSCollector().run_ingest(db)
    except Exception as exc:  # noqa: BLE001 - surface collector failures as 502
        raise HTTPException(status_code=502, detail=f"RSS ingest failed: {exc}") from exc
    return IngestOut(
        source=result["source"],
        observations_added=result["observations_added"],
        status=result["status"],
        message=f"RSS ingest complete: {result['observations_added']} observations added.",
    )
