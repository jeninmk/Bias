"""
Scoring engine.

Signals are computed per attribute over rolling weekly windows, then
combined into a Trend Score (0-100):

    Trend Score = 0.30*velocity + 0.20*volume + 0.20*breadth
                + 0.10*sentiment + 0.10*resale + 0.10*authority

Each component is normalized to 0-100 BEFORE weighting, so no single
signal can dominate because of raw units (mentions vs prices).

- velocity:  week-over-week growth of the latest complete week.
             0% growth scores 50; +50% scores 100; -50% scores 0.
- volume:    recency-decayed total volume, log-normalized against the
             highest-volume trend in the dataset.
- breadth:   distinct source categories observing the trend, out of
             the 17 in the catalog. Cross-source confirmation is the
             strongest signal: a trend seen on TikTok AND the runway
             AND resale is far more real than a TikTok-only spike.
- sentiment: volume-weighted average sentiment over the last 4 weeks,
             mapped from [-1, 1] to [0, 100].
- resale:    resale price premium vs retail blended with sell-through
             rate. 50 (neutral) when no resale data exists.
- authority: share of recent volume from runway, editorial, and
             color-authority sources, scaled up (early signals from
             these sources matter more than their raw volume).

Recency: observations decay exponentially with a 14-day half-life,
so last week's runway show counts more than a mention from two
months ago. Velocity uses RAW weekly volumes (decay would distort
the growth rate); volume, sentiment, and authority use decayed
volumes.

Confidence (0-100) = 0.5 * observation-count score + 0.5 * source
diversity, so a score built on 30 observations across 9 sources is
trusted more than one built on 4 observations from 1 source.

Port of ``src/engine/score.ts``. Read line by line; the structure,
constants, and formulas below mirror it exactly.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

from .forecast import forecast_peak, ForecastInputs
from .lifecycle import classify_stage, StageInputs
from .types import Observation, ScoredTrend, TrendScore

# Number of source categories in the catalog.
SOURCE_CATEGORY_COUNT = 17

# Recency half-life in days: an observation loses half its weight every 14 days.
RECENCY_HALF_LIFE_DAYS = 14

# How many trailing weeks of raw volume feed velocity and acceleration.
VELOCITY_WINDOW_WEEKS = 8

# How many trailing weeks count as "recent" for breadth, sentiment, authority.
RECENT_WINDOW_WEEKS = 4

# Source categories that carry authority weight (early signals).
AUTHORITY_CATEGORIES: list[str] = ["runway", "editorial", "color-authority"]


def _clamp(n: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, n))


def _js_round(n: float) -> int:
    """JavaScript Math.round: halves round up.

    Python's built-in round() is banker's rounding (halves to even),
    which would diverge from the TS engine on exact .5 values, so the
    engine uses this everywhere the TS code calls Math.round.
    """
    return int(math.floor(n + 0.5))


def parse_timestamp(value: str) -> datetime:
    """Parse an ISO 8601 timestamp (accepts a trailing ``Z``)."""
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def week_start(d: datetime) -> datetime:
    """Monday (UTC) of the week containing ``d``, at 00:00 UTC."""
    x = d.astimezone(timezone.utc)
    day = (x.weekday())  # Monday = 0, matching (getUTCDay() + 6) % 7
    x = x - timedelta(days=day)
    return x.replace(hour=0, minute=0, second=0, microsecond=0)


def week_key(d: datetime) -> str:
    return week_start(d).date().isoformat()


def recency_weight(
    timestamp: str,
    as_of: datetime,
    half_life_days: float = RECENCY_HALF_LIFE_DAYS,
) -> float:
    """Exponential recency weight: 1.0 for an observation from today,
    0.5 after one half-life (14 days), 0.25 after two, and so on."""
    age_ms = (as_of - parse_timestamp(timestamp)).total_seconds() * 1000
    age_days = max(0.0, age_ms / 86_400_000)
    return math.pow(0.5, age_days / half_life_days)


def growth_rate(current: float, previous: float) -> float:
    """Week-over-week growth rate: 0.35 means +35%. Guards against zero denominators."""
    if previous <= 0:
        return 1.0 if current > 0 else 0.0
    return (current - previous) / previous


def _group_by_trend(all_obs: list[Observation]) -> dict[str, list[Observation]]:
    grouped: dict[str, list[Observation]] = {}
    for o in all_obs:
        grouped.setdefault(o.canonical_attribute, []).append(o)
    return grouped


def _weekly_volumes(
    observations: list[Observation],
    anchor_week: datetime,
    weeks: int,
) -> list[dict]:
    """Raw weekly volumes for one trend, newest first, for the last N weeks
    ending at the anchor week."""
    keys: list[str] = []
    cursor = week_start(anchor_week)
    for _ in range(weeks):
        keys.append(cursor.date().isoformat())
        cursor = cursor - timedelta(days=7)
    totals: dict[str, float] = {}
    for o in observations:
        key = week_key(parse_timestamp(o.timestamp))
        totals[key] = totals.get(key, 0) + o.volume
    return [{"key": key, "volume": totals.get(key, 0)} for key in keys]


def weekly_volumes_chronological(
    observations: list[Observation],
    anchor_week: datetime,
    weeks: int,
) -> list[dict]:
    """Weekly volumes oldest first (for the detail-page chart)."""
    return list(reversed(_weekly_volumes(observations, anchor_week, weeks)))


def latest_week_start(all_obs: list[Observation]) -> datetime:
    """Monday (UTC) of the freshest week actually present in the data."""
    latest = 0.0
    for o in all_obs:
        ws = week_start(parse_timestamp(o.timestamp)).timestamp()
        if ws > latest:
            latest = ws
    return datetime.fromtimestamp(latest, tz=timezone.utc)


def score_trends(all_obs: list[Observation], as_of: datetime) -> list[ScoredTrend]:
    """Score every trend in the dataset, ranked by Trend Score descending."""
    by_trend = _group_by_trend(all_obs)

    # Anchor the weekly windows to the freshest week actually present in
    # the data, so the "latest complete week" is never an empty future
    # week (e.g. scoring on a Monday for a week that has not happened yet).
    anchor_week = latest_week_start(all_obs)

    # First pass: recency-decayed totals, for the volume normalization.
    decayed_totals: dict[str, float] = {}
    for canonical, obs in by_trend.items():
        total = 0.0
        for o in obs:
            total += o.volume * recency_weight(o.timestamp, as_of)
        decayed_totals[canonical] = total
    max_decayed_total = max(1.0, *decayed_totals.values())

    scored: list[ScoredTrend] = []

    for canonical, obs in by_trend.items():
        attribute_type = obs[0].attribute_type
        weeks = _weekly_volumes(obs, anchor_week, VELOCITY_WINDOW_WEEKS)
        latest, previous, previous2 = weeks[0], weeks[1], weeks[2]
        latest_week_volume = latest["volume"]
        previous_week_volume = previous["volume"]

        velocity_rate = growth_rate(latest_week_volume, previous_week_volume)
        previous_rate = growth_rate(previous_week_volume, previous2["volume"])
        acceleration_rate = velocity_rate - previous_rate

        # --- velocity component: 0% growth -> 50, +50% -> 100, -50% -> 0.
        velocity_score = _clamp(50 + velocity_rate * 100, 0, 100)

        # --- volume component: log-normalized decayed total vs dataset max.
        decayed_total = decayed_totals.get(canonical, 0)
        relative_volume = decayed_total / max_decayed_total
        volume_score = _clamp(
            (100 * math.log1p(decayed_total)) / math.log1p(max_decayed_total),
            0,
            100,
        )

        # --- breadth component: distinct source categories in the recent window.
        recent_cutoff = as_of - timedelta(days=RECENT_WINDOW_WEEKS * 7)
        recent_obs = [
            o for o in obs if parse_timestamp(o.timestamp) >= recent_cutoff
        ]
        categories = {o.source_category for o in recent_obs}
        breadth_score = (len(categories) / SOURCE_CATEGORY_COUNT) * 100

        # --- sentiment component: volume-weighted average sentiment, recent window.
        sentiment_volume = 0.0
        sentiment_weighted = 0.0
        for o in recent_obs:
            sentiment_weighted += o.sentiment * o.volume
            sentiment_volume += o.volume
        avg_sentiment = (
            sentiment_weighted / sentiment_volume if sentiment_volume > 0 else 0
        )
        sentiment_score = _clamp(((avg_sentiment + 1) / 2) * 100, 0, 100)

        # --- resale component: price premium vs retail + sell-through.
        resale_score = 50.0  # neutral when no resale data exists
        priced = [
            o
            for o in obs
            if o.price is not None
            and o.price.avg_resale_price is not None
            and o.price.retail_price is not None
            and o.price.retail_price > 0
        ]
        if priced:
            premium_sum = 0.0
            sell_through_sum = 0.0
            sell_through_count = 0
            for o in priced:
                p = o.price
                premium_sum += (p.avg_resale_price - p.retail_price) / p.retail_price  # type: ignore[operator]
                if p.sell_through_rate is not None:
                    sell_through_sum += p.sell_through_rate
                    sell_through_count += 1
            avg_premium = premium_sum / len(priced)
            premium_score = _clamp(50 + avg_premium * 100, 0, 100)
            sell_through_score = (
                _clamp((sell_through_sum / sell_through_count) * 100, 0, 100)
                if sell_through_count > 0
                else 50
            )
            resale_score = _clamp(
                0.6 * premium_score + 0.4 * sell_through_score, 0, 100
            )

        # --- authority component: runway/editorial/color-authority share of recent volume.
        authority_volume = 0.0
        recent_volume = 0.0
        for o in recent_obs:
            recent_volume += o.volume
            if o.source_category in AUTHORITY_CATEGORIES:
                authority_volume += o.volume
        authority_share = authority_volume / recent_volume if recent_volume > 0 else 0
        # Scaled x2: authority sources are a small share of total volume but
        # carry outsized early-signal value. Capped at 100.
        authority_score = _clamp(authority_share * 200, 0, 100)

        # --- final weighted score.
        trend_score = _js_round(
            0.3 * velocity_score
            + 0.2 * volume_score
            + 0.2 * breadth_score
            + 0.1 * sentiment_score
            + 0.1 * resale_score
            + 0.1 * authority_score
        )

        # --- confidence: observation count and source diversity.
        count_score = _clamp((len(obs) / 25) * 100, 0, 100)
        diversity_score = (len(categories) / SOURCE_CATEGORY_COUNT) * 100
        confidence = _js_round(0.5 * count_score + 0.5 * diversity_score)

        score = TrendScore(
            trend_score=trend_score,
            velocity=_js_round(velocity_score),
            volume=_js_round(volume_score),
            breadth=_js_round(breadth_score),
            sentiment=_js_round(sentiment_score),
            resale=_js_round(resale_score),
            authority=_js_round(authority_score),
            confidence=confidence,
        )

        stage = classify_stage(
            StageInputs(
                relative_volume=relative_volume,
                velocity_rate=velocity_rate,
                breadth_count=len(categories),
            )
        )

        forecast = forecast_peak(
            ForecastInputs(
                attribute_type=attribute_type,
                stage=stage,
                velocity_rate=velocity_rate,
                relative_volume=relative_volume,
                trend_score=trend_score,
            )
        )

        scored.append(
            ScoredTrend(
                canonical_attribute=canonical,
                attribute_type=attribute_type,
                score=score,
                stage=stage,
                observation_count=len(obs),
                source_categories=list(categories),
                total_volume=_js_round(decayed_total),
                latest_week_volume=latest_week_volume,
                previous_week_volume=previous_week_volume,
                velocity_rate=velocity_rate,
                acceleration_rate=acceleration_rate,
                relative_volume=relative_volume,
                forecast=forecast,
            )
        )

    scored.sort(key=lambda t: t.score.trend_score, reverse=True)
    return scored
