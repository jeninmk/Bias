"""
Peak forecasting.

Projects when a trend will peak from its current position on the
velocity curve and the typical lifecycle length of its attribute type.
Colors and aesthetics run longer than micro-trends on single items;
that is why the lifecycle length is per attribute type.

Model:
- progress is approximated by relative volume (how big the trend
  already is vs the biggest trend in the dataset).
- weeks_to_peak = typical lifecycle weeks x (1 - progress), so a trend
  that is still small with strong velocity has further to run.
- the peak window is wider for slow-burn types (color, aesthetic)
  and narrower for fast ones (item, pattern).
- estimated_peak_score grows with current velocity, capped at 100.

Declining and dead trends have already peaked: weeks_to_peak is 0.

Port of ``src/engine/forecast.ts``.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from .types import Forecast

# Typical full lifecycle length in weeks, by attribute type.
TYPICAL_LIFECYCLE_WEEKS: dict[str, int] = {
    "color": 10,
    "pattern": 8,
    "silhouette": 8,
    "item": 6,
    "fabric": 8,
    "aesthetic": 12,
}


@dataclass
class ForecastInputs:
    attribute_type: str
    stage: str
    velocity_rate: float  # Latest week-over-week growth rate.
    relative_volume: float  # Volume relative to the highest-volume trend (0-1).
    trend_score: int  # Current Trend Score (0-100).


def _clamp(n: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, n))


def _js_round(n: float) -> int:
    """JavaScript Math.round: halves round up (away from zero for >= 0).

    Python's built-in round() is banker's rounding (halves to even),
    which would diverge from the TS engine on exact .5 values, so the
    engine uses this everywhere the TS code calls Math.round.
    """
    return int(math.floor(n + 0.5))


def forecast_peak(inp: ForecastInputs) -> Forecast:
    attribute_type = inp.attribute_type
    stage = inp.stage
    velocity_rate = inp.velocity_rate
    relative_volume = inp.relative_volume
    trend_score = inp.trend_score

    # Already past the peak: no future window to project.
    if stage in ("declining", "dead"):
        return Forecast(
            weeks_to_peak=0,
            peak_window_start_weeks=0,
            peak_window_end_weeks=0,
            estimated_peak_score=_js_round(trend_score),
        )

    typical = TYPICAL_LIFECYCLE_WEEKS[attribute_type]
    remaining = typical * (1 - _clamp(relative_volume, 0, 1))

    # A trend already at peak is ~1 week from its highest point.
    if stage == "peak":
        weeks_to_peak = 1
    else:
        weeks_to_peak = int(_clamp(_js_round(remaining), 1, 12))

    # Slow-burn types peak over a wider window.
    window_width = 3 if attribute_type in ("color", "aesthetic") else 2

    estimated_peak_score = int(
        _clamp(
            _js_round(trend_score * (1 + max(0, velocity_rate) * 0.25)),
            0,
            100,
        )
    )

    return Forecast(
        weeks_to_peak=weeks_to_peak,
        peak_window_start_weeks=weeks_to_peak,
        peak_window_end_weeks=weeks_to_peak + window_width,
        estimated_peak_score=estimated_peak_score,
    )
