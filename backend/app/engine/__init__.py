"""
Public surface of the forecasting engine.
All scoring is pure functions over observations: no I/O, no network,
no database. The API and collectors feed observations in and read
scored trends out.

Port of ``src/engine/index.ts``.
"""

from .types import (
    Observation,
    PriceData,
    TrendScore,
    Forecast,
    ScoredTrend,
    SourceBreakdown,
    WeeklyVolume,
    SOURCE_CATEGORIES,
)
from .synonyms import SYNONYM_MAP
from .normalize import normalize_attribute, variants_for
from .score import (
    SOURCE_CATEGORY_COUNT,
    RECENCY_HALF_LIFE_DAYS,
    VELOCITY_WINDOW_WEEKS,
    RECENT_WINDOW_WEEKS,
    AUTHORITY_CATEGORIES,
    week_start,
    week_key,
    recency_weight,
    growth_rate,
    score_trends,
    latest_week_start,
    weekly_volumes_chronological,
    parse_timestamp,
)
from .lifecycle import classify_stage, StageInputs, STAGE_LABELS
from .forecast import forecast_peak, ForecastInputs, TYPICAL_LIFECYCLE_WEEKS

__all__ = [
    "Observation",
    "PriceData",
    "TrendScore",
    "Forecast",
    "ScoredTrend",
    "SourceBreakdown",
    "WeeklyVolume",
    "SOURCE_CATEGORIES",
    "SYNONYM_MAP",
    "normalize_attribute",
    "variants_for",
    "SOURCE_CATEGORY_COUNT",
    "RECENCY_HALF_LIFE_DAYS",
    "VELOCITY_WINDOW_WEEKS",
    "RECENT_WINDOW_WEEKS",
    "AUTHORITY_CATEGORIES",
    "week_start",
    "week_key",
    "recency_weight",
    "growth_rate",
    "score_trends",
    "latest_week_start",
    "weekly_volumes_chronological",
    "parse_timestamp",
    "classify_stage",
    "StageInputs",
    "STAGE_LABELS",
    "forecast_peak",
    "ForecastInputs",
    "TYPICAL_LIFECYCLE_WEEKS",
]
