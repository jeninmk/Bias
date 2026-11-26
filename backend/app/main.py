"""Bias API: FastAPI app serving scored fashion trends from the DB.

Endpoints:
    GET  /health               liveness check
    GET  /api/trends           ranked list of trends (from stored scores)
    GET  /api/trends/{slug}    one trend: score breakdown, forecast,
                               weekly volumes, per-source breakdown
    GET  /api/colors           color trends with palette data
    GET  /api/methodology      the public methodology summary
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
    SOURCE_CATEGORIES,
    VELOCITY_WINDOW_WEEKS,
    latest_week_start,
    weekly_volumes_chronological,
)
from .engine.types import Observation as EngineObservation
from .models import (
    Observation as ObservationRow,
    TrendImage,
    TrendScore,
    TrendSnapshot,
)
from .schemas import (
    ColorTrendOut,
    CoverImageOut,
    ForecastOut,
    IngestOut,
    SourceBreakdownOut,
    StayingPowerOut,
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

app = FastAPI(title="Bias: Fashion Trend Forecasting API", version="0.1.0")
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


def _staying_power(db: Session, canonical: str) -> StayingPowerOut | None:
    """Weeks in the Top 5 / Top 10 and the current Top 10 streak.

    Read from stored snapshots (one row per trend per scoring event).
    The streak counts consecutive snapshot weeks, latest first, in
    which the trend ranked in the Top 10. Returns None until any
    snapshot exists for the trend, so the frontend can omit the line
    instead of inventing a history.
    """
    rows = (
        db.query(TrendSnapshot)
        .filter(TrendSnapshot.canonical_attribute == canonical)
        .order_by(TrendSnapshot.snapshot_date.desc())
        .all()
    )
    if not rows:
        return None
    by_date: dict = {}
    for row in rows:
        by_date.setdefault(row.snapshot_date, row.rank)
    dates = sorted(by_date, reverse=True)
    weeks_top_5 = sum(1 for d in dates if by_date[d] <= 5)
    weeks_top_10 = sum(1 for d in dates if by_date[d] <= 10)
    streak = 0
    for d in dates:
        if by_date[d] <= 10:
            streak += 1
        else:
            break
    return StayingPowerOut(
        weeks_in_top_5=weeks_top_5,
        weeks_in_top_10=weeks_top_10,
        current_streak_weeks=streak,
    )


def _trend_out(row: TrendScore, db: Session) -> TrendOut:
    image = (
        db.query(TrendImage)
        .filter(TrendImage.canonical_attribute == row.canonical_attribute)
        .first()
    )
    cover = (
        CoverImageOut(
            image_url=image.image_url,
            source=image.image_source,
            article_url=image.article_url,
            article_title=image.article_title,
        )
        if image
        else None
    )
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
        cover_image=cover,
        staying_power=_staying_power(db, row.canonical_attribute),
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
    return TrendsListOut(trends=[_trend_out(r, db) for r in rows], count=len(rows))


@app.get("/api/trends/{slug}", response_model=TrendDetailOut)
@limiter.limit(f"{config.RATE_LIMIT_PER_MINUTE} per minute")
def trend_detail(request: Request, slug: str, db: Session = Depends(get_db)):
    row = _find_trend_row(db, slug)
    base = _trend_out(row, db)

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
    """Public methodology summary.

    Deliberately high level: the scoring recipe itself is private,
    so this returns what the score is made of and where the data
    comes from, never the formula, weights, normalizations, or
    thresholds.
    """
    return {
        "summary": (
            "Every trend gets a Trend Score from 0 to 100, built from six "
            "signals: momentum, volume, breadth, sentiment, resale, and "
            "authority, across 17 source categories."
        ),
        "signals": [
            {
                "name": "momentum",
                "description": "Is the trend picking up speed, week over week?",
            },
            {
                "name": "volume",
                "description": "How much are people talking about it and searching for it?",
            },
            {
                "name": "breadth",
                "description": "How many different kinds of sources are seeing it?",
            },
            {
                "name": "sentiment",
                "description": "Do people like it, or just argue about it?",
            },
            {
                "name": "resale",
                "description": "Are people paying more than retail for it secondhand?",
            },
            {
                "name": "authority",
                "description": "Did the runway and the editors get there first?",
            },
            {
                "name": "confidence",
                "description": (
                    "How steady the score is, from how many sightings "
                    "across how many sources."
                ),
            },
        ],
        "hashtags": ["#fashiontok", "#ootd"],
        "source_categories": SOURCE_CATEGORIES,
        "source_category_count": len(SOURCE_CATEGORIES),
        "lifecycle_stages": [
            {
                "stage": "emerging",
                "description": "Small, growing fast, seen in just a few places.",
            },
            {
                "stage": "rising",
                "description": "Gaining ground: more mentions, more places, more people.",
            },
            {
                "stage": "peak",
                "description": "Everywhere at once, and leveling off.",
            },
            {"stage": "declining", "description": "Cooling down, week over week."},
            {"stage": "dead", "description": "Gone quiet."},
        ],
        "data_note": (
            "Scores currently come from a curated seed dataset of 433 "
            "observations across 12 trends and 8 weeks. Editorial headlines "
            "are the first live feed being connected; social-platform feeds "
            "need approved access."
        ),
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
