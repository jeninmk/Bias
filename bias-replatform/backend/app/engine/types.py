"""
Core types for the fashion trend forecasting engine.

A trend candidate is ONE attribute: a color, pattern, silhouette, item,
fabric, or aesthetic. Every signal the engine computes is derived from
observations of that attribute across many sources.

Port of ``src/engine/types.ts`` — pure data, no I/O.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

AttributeType = Literal["color", "pattern", "silhouette", "item", "fabric", "aesthetic"]

SourceCategory = Literal[
    "tiktok",
    "twitter",
    "instagram",
    "pinterest",
    "resale",
    "runway",
    "editorial",
    "color-authority",
    "search",
    "retail",
    "lyst",
    "celebrity",
    "reddit",
    "music",
    "youtube",
    "ecommerce-search",
    "trend-service",
]

LifecycleStage = Literal["emerging", "rising", "peak", "declining", "dead"]

# All 17 source categories in the collector catalog.
SOURCE_CATEGORIES: list[str] = [
    "tiktok",
    "twitter",
    "instagram",
    "pinterest",
    "resale",
    "runway",
    "editorial",
    "color-authority",
    "search",
    "retail",
    "lyst",
    "celebrity",
    "reddit",
    "music",
    "youtube",
    "ecommerce-search",
    "trend-service",
]


@dataclass
class PriceData:
    """Optional price evidence, mostly from resale sources."""

    avg_resale_price: Optional[float] = None
    retail_price: Optional[float] = None
    sold_count: Optional[int] = None
    sell_through_rate: Optional[float] = None


@dataclass
class Observation:
    """One recorded sighting of an attribute from one source.

    ``attribute`` is the raw term as it appeared (e.g. "burgundy");
    ``canonical_attribute`` is the normalized family it belongs to
    (e.g. "oxblood").
    """

    id: str
    attribute: str
    attribute_type: str  # AttributeType
    canonical_attribute: str
    source: str
    source_category: str  # SourceCategory
    timestamp: str  # ISO 8601 timestamp of the observation window
    volume: float
    sentiment: float  # -1 (negative) to 1 (positive)
    price: Optional[PriceData] = None


@dataclass
class TrendScore:
    """The six normalized (0-100) scoring components plus the final score."""

    trend_score: int
    velocity: int
    volume: int
    breadth: int
    sentiment: int
    resale: int
    authority: int
    confidence: int


@dataclass
class Forecast:
    """Forecast of when the trend will peak."""

    weeks_to_peak: int
    peak_window_start_weeks: int
    peak_window_end_weeks: int
    estimated_peak_score: int


@dataclass
class ScoredTrend:
    """A trend candidate with every computed signal attached."""

    canonical_attribute: str
    attribute_type: str  # AttributeType
    score: TrendScore
    stage: str  # LifecycleStage
    observation_count: int
    source_categories: list[str] = field(default_factory=list)
    total_volume: int = 0  # Recency-decayed total volume.
    latest_week_volume: float = 0
    previous_week_volume: float = 0
    velocity_rate: float = 0.0  # Week-over-week growth, e.g. 0.35 = +35%.
    acceleration_rate: float = 0.0
    relative_volume: float = 0.0  # vs the highest-volume trend (0-1).
    forecast: Optional[Forecast] = None


@dataclass
class SourceBreakdown:
    """Per-source-category rollup used on the trend detail page."""

    category: str
    sources: list[str] = field(default_factory=list)
    observation_count: int = 0
    volume: float = 0
    volume_share: float = 0.0
    avg_sentiment: float = 0.0


@dataclass
class WeeklyVolume:
    """One week of volume for the trend detail chart."""

    week: str  # Monday of the week, ISO date (YYYY-MM-DD).
    volume: float = 0
