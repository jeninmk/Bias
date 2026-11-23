"""SQLAlchemy models.

- Observation: one recorded sighting of an attribute from one source.
- TrendScore: one computed score row per canonical attribute (recomputed
  on seed / ingest; the API reads these rows).
- IngestionRun: one record per collector run (source, timing, counts,
  status/error) so ingestion is auditable.

SQLite for local dev; Postgres via ``DATABASE_URL``.
``create_all`` is acceptable for v1; Alembic is the follow-up before
any production deploy.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
)

from .db import Base


class Observation(Base):
    __tablename__ = "observations"

    id = Column(String, primary_key=True)
    attribute = Column(String, nullable=False)
    attribute_type = Column(String, nullable=False)
    canonical_attribute = Column(String, nullable=False, index=True)
    source = Column(String, nullable=False)
    source_category = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    volume = Column(Float, nullable=False)
    sentiment = Column(Float, nullable=False)
    # Optional price evidence: {"avg_resale_price", "retail_price",
    # "sold_count", "sell_through_rate"}.
    price = Column(JSON, nullable=True)


class TrendScore(Base):
    __tablename__ = "trend_scores"

    # One row per canonical attribute; recomputed on seed / ingest.
    canonical_attribute = Column(String, primary_key=True)
    attribute_type = Column(String, nullable=False)
    trend_score = Column(Integer, nullable=False)
    velocity = Column(Integer, nullable=False)
    volume = Column(Integer, nullable=False)
    breadth = Column(Integer, nullable=False)
    sentiment = Column(Integer, nullable=False)
    resale = Column(Integer, nullable=False)
    authority = Column(Integer, nullable=False)
    confidence = Column(Integer, nullable=False)
    stage = Column(String, nullable=False)
    observation_count = Column(Integer, nullable=False)
    total_volume = Column(Integer, nullable=False)
    # Full ScoredTrend fields, so the API can serve stored rows directly.
    latest_week_volume = Column(Float, nullable=False, default=0)
    previous_week_volume = Column(Float, nullable=False, default=0)
    velocity_rate = Column(Float, nullable=False, default=0)
    acceleration_rate = Column(Float, nullable=False, default=0)
    relative_volume = Column(Float, nullable=False, default=0)
    source_categories = Column(JSON, nullable=False, default=list)
    weeks_to_peak = Column(Integer, nullable=False)
    peak_window_start_weeks = Column(Integer, nullable=False)
    peak_window_end_weeks = Column(Integer, nullable=False)
    estimated_peak_score = Column(Integer, nullable=False)
    computed_at = Column(DateTime(timezone=True), nullable=False)


class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)  # e.g. "rss", "youtube", "ebay", "seed"
    started_at = Column(DateTime(timezone=True), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    observations_added = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="running")
    error = Column(Text, nullable=True)
