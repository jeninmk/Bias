"""Pydantic response schemas.

Field names mirror the v1 ``ScoredTrend`` / ``TrendScore`` / ``Forecast``
types from ``src/engine/types.ts``, translated to snake_case.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TrendScoreOut(BaseModel):
    trend_score: int
    velocity: int
    volume: int
    breadth: int
    sentiment: int
    resale: int
    authority: int
    confidence: int


class ForecastOut(BaseModel):
    weeks_to_peak: int
    peak_window_start_weeks: int
    peak_window_end_weeks: int
    estimated_peak_score: int


class CoverImageOut(BaseModel):
    """A trend's cover photo, captured from a magazine article.

    ``source`` is the publication (e.g. "Vogue"); ``article_url`` /
    ``article_title`` point at the article it came from. Null on the
    trend when no article image has been captured yet.
    """

    image_url: str
    source: str
    article_url: Optional[str] = None
    article_title: Optional[str] = None


class StayingPowerOut(BaseModel):
    """How often a trend keeps making the top ranks.

    Counts distinct snapshot weeks (one snapshot per scoring event).
    Null on the trend until any snapshot exists.
    """

    weeks_in_top_5: int
    weeks_in_top_10: int
    current_streak_weeks: int


class TrendOut(BaseModel):
    canonical_attribute: str
    attribute_type: str
    score: TrendScoreOut
    stage: str
    observation_count: int
    source_categories: list[str]
    total_volume: int
    latest_week_volume: float
    previous_week_volume: float
    velocity_rate: float
    acceleration_rate: float
    relative_volume: float
    forecast: ForecastOut
    computed_at: Optional[datetime] = None
    cover_image: Optional[CoverImageOut] = None
    staying_power: Optional[StayingPowerOut] = None

    @classmethod
    def from_scored(cls, t, computed_at=None) -> "TrendOut":
        return cls(
            canonical_attribute=t.canonical_attribute,
            attribute_type=t.attribute_type,
            score=TrendScoreOut(
                trend_score=t.score.trend_score,
                velocity=t.score.velocity,
                volume=t.score.volume,
                breadth=t.score.breadth,
                sentiment=t.score.sentiment,
                resale=t.score.resale,
                authority=t.score.authority,
                confidence=t.score.confidence,
            ),
            stage=t.stage,
            observation_count=t.observation_count,
            source_categories=t.source_categories,
            total_volume=t.total_volume,
            latest_week_volume=t.latest_week_volume,
            previous_week_volume=t.previous_week_volume,
            velocity_rate=t.velocity_rate,
            acceleration_rate=t.acceleration_rate,
            relative_volume=t.relative_volume,
            forecast=ForecastOut(
                weeks_to_peak=t.forecast.weeks_to_peak,
                peak_window_start_weeks=t.forecast.peak_window_start_weeks,
                peak_window_end_weeks=t.forecast.peak_window_end_weeks,
                estimated_peak_score=t.forecast.estimated_peak_score,
            ),
            computed_at=computed_at,
        )


class SourceBreakdownOut(BaseModel):
    category: str
    sources: list[str]
    observation_count: int
    volume: float
    volume_share: float
    avg_sentiment: float


class WeeklyVolumeOut(BaseModel):
    week: str
    volume: float


class TrendDetailOut(TrendOut):
    weekly_volumes: list[WeeklyVolumeOut] = []
    source_breakdown: list[SourceBreakdownOut] = []


class TrendsListOut(BaseModel):
    trends: list[TrendOut]
    count: int
    message: Optional[str] = None


class ColorTrendOut(BaseModel):
    canonical_attribute: str
    attribute_type: str
    score: TrendScoreOut
    stage: str
    palette: list[str]
    computed_at: Optional[datetime] = None


class IngestOut(BaseModel):
    source: str
    observations_added: int
    status: str
    message: str
