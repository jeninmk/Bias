"""
Lifecycle classification.

A trend's stage is read off the shape of its velocity curve and its
breadth (how many source categories are observing it), not from any
single week's volume:

- emerging:   low volume, high velocity, low breadth. Seen on a few
               sources, growing fast, not yet mainstream.
- rising:     volume and breadth both growing. The default for a trend
               with positive velocity that is not (yet) peaking.
- peak:       high volume, velocity flattening toward zero. Everyone
               is talking about it and growth has stalled.
- declining:  negative velocity. Mentions are falling week over week.
- dead:       very low volume AND still falling. The conversation
               has moved on.

Port of ``src/engine/lifecycle.ts``. (The Tailwind badge classes in the
TS file are a frontend concern and are not ported; stage labels are.)
"""

from __future__ import annotations

from dataclasses import dataclass

STAGE_LABELS: dict[str, str] = {
    "emerging": "Emerging",
    "rising": "Rising",
    "peak": "Peak",
    "declining": "Declining",
    "dead": "Dead",
}


@dataclass
class StageInputs:
    relative_volume: float  # vs the highest-volume trend in the dataset (0-1)
    velocity_rate: float  # Latest week-over-week growth rate, e.g. 0.35 = +35%.
    breadth_count: int  # Number of distinct source categories observing the trend.


def classify_stage(inp: StageInputs) -> str:
    relative_volume = inp.relative_volume
    velocity_rate = inp.velocity_rate
    breadth_count = inp.breadth_count

    if relative_volume <= 0.12 and velocity_rate <= -0.2:
        return "dead"
    if velocity_rate <= -0.15:
        return "declining"
    if relative_volume < 0.35 and velocity_rate > 0.25 and breadth_count <= 5:
        return "emerging"
    if relative_volume >= 0.6 and abs(velocity_rate) <= 0.15:
        return "peak"
    return "rising"
