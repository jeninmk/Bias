"""SQLAlchemy models.

- Observation: one recorded sighting of an attribute from one source.
- TrendScore: one computed score row per canonical attribute (recomputed
  on seed / ingest; the API reads these rows).
- IngestionRun: one record per collector run (source, timing, counts,
  status/error) so ingestion is auditable.
- TrendSnapshot: one row per trend per scoring event (rank + score),
  kept forever so staying power (weeks in the Top 5 / Top 10, current
  streak) can be computed from history.
- TrendImage: one cover image per canonical attribute, the freshest
  article image captured by a collector, with publication credit.

SQLite for local dev; Postgres via ``DATABASE_URL``.
``create_all`` is acceptable for v1; Alembic is the follow-up before
any production deploy. New tables are safe under ``create_all``;
never add a column to an existing table without a migration.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    Date,
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


class TrendSnapshot(Base):
    """One row per trend per scoring event, kept forever.

    Written every time scores are computed (seed or ingest), so staying
    power can be read from history: weeks in the Top 5 / Top 10 and the
    current Top 10 streak. ``snapshot_date`` is the scoring date (the
    freshest observation date); re-scoring the same date replaces that
    date's rows, so the table stays one row per trend per date.
    """

    __tablename__ = "trend_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    canonical_attribute = Column(String, nullable=False, index=True)
    attribute_type = Column(String, nullable=False)
    trend_score = Column(Integer, nullable=False)
    rank = Column(Integer, nullable=False)
    stage = Column(String, nullable=False)
    snapshot_date = Column(Date, nullable=False, index=True)
    computed_at = Column(DateTime(timezone=True), nullable=False)


class TrendImage(Base):
    """One cover image per canonical attribute.

    The freshest article image captured by a collector (RSS today),
    with the publication as credit. Updated on each ingest when a
    newer article image for the trend arrives; the API serves it as
    the trend's cover photo.
    """

    __tablename__ = "trend_images"

    canonical_attribute = Column(String, primary_key=True)
    image_url = Column(String, nullable=False)
    image_source = Column(String, nullable=False)  # publication name
    article_url = Column(String, nullable=True)
    article_title = Column(String, nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=False)
