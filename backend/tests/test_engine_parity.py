"""Parity tests: the Python engine must reproduce the TypeScript
engine's scores and stages over the v1 seed dataset.

Expected values come from the v1 report (scores allow +/-1 tolerance,
stages must match exactly). Scoring date is the freshest observation
in the seed data. The TS engine anchors its weekly windows to the
freshest week present and computes recency decay vs the scoring date.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.engine import (
    TYPICAL_LIFECYCLE_WEEKS,
    classify_stage,
    forecast_peak,
    growth_rate,
    normalize_attribute,
    recency_weight,
    score_trends,
    variants_for,
)
from app.engine.forecast import ForecastInputs
from app.engine.lifecycle import StageInputs
from app.engine.score import parse_timestamp
from app.engine.types import Observation, PriceData

SEED_PATH = Path(__file__).resolve().parent.parent.parent / "src" / "data" / "seed-observations.json"

# (canonical attribute, expected score, expected stage) from the v1 report.
EXPECTED = [
    ("polka dots", 72, "emerging"),
    ("oxblood", 63, "peak"),
    ("leopard print", 63, "peak"),
    ("plaid", 63, "rising"),
    ("eclectic maximalist", 62, "rising"),
    ("moto jacket", 61, "rising"),
    ("barrel jeans", 61, "rising"),
    ("sheer", 60, "rising"),
    ("chocolate brown", 60, "rising"),
    ("oversized blazer", 56, "peak"),
    ("ballet flats", 43, "declining"),
    ("butter yellow", 43, "declining"),
]


def load_seed_observations() -> list[Observation]:
    raw = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    obs = []
    for o in raw:
        price = o.get("price")
        obs.append(
            Observation(
                id=o["id"],
                attribute=o["attribute"],
                attribute_type=o["attributeType"],
                canonical_attribute=o["canonicalAttribute"],
                source=o["source"],
                source_category=o["sourceCategory"],
                timestamp=o["timestamp"],
                volume=o["volume"],
                sentiment=o["sentiment"],
                price=PriceData(
                    avg_resale_price=price.get("avgResalePrice"),
                    retail_price=price.get("retailPrice"),
                    sold_count=price.get("soldCount"),
                    sell_through_rate=price.get("sellThroughRate"),
                )
                if price
                else None,
            )
        )
    return obs


@pytest.fixture(scope="module")
def scored():
    obs = load_seed_observations()
    as_of = max(parse_timestamp(o.timestamp) for o in obs)
    return {t.canonical_attribute: t for t in score_trends(obs, as_of)}


def test_seed_loads_433_observations_across_12_trends():
    obs = load_seed_observations()
    assert len(obs) == 433
    assert len({o.canonical_attribute for o in obs}) == 12


@pytest.mark.parametrize("canonical,expected_score,expected_stage", EXPECTED)
def test_parity_score_and_stage(scored, canonical, expected_score, expected_stage):
    trend = scored[canonical]
    assert trend.score.trend_score == pytest.approx(expected_score, abs=1), (
        f"{canonical}: got {trend.score.trend_score}, expected {expected_score} +/-1"
    )
    assert trend.stage == expected_stage, (
        f"{canonical}: got stage {trend.stage}, expected {expected_stage}"
    )


def test_parity_ranking_is_descending(scored):
    scores = [t.score.trend_score for t in sorted(scored.values(), key=lambda t: -t.score.trend_score)]
    assert scores == sorted(scores, reverse=True)
    assert scores[0] == pytest.approx(72, abs=1)


def test_parity_all_twelve_trends_present(scored):
    assert set(scored) == {name for name, _, _ in EXPECTED}


def test_normalize_synonyms():
    assert normalize_attribute("burgundy") == "oxblood"
    assert normalize_attribute("  Cherry Red ") == "oxblood"
    assert normalize_attribute("mesh") == "sheer"
    assert normalize_attribute("tartan") == "plaid"
    assert normalize_attribute("maximalist") == "eclectic maximalist"
    assert normalize_attribute("some unknown thing") == "some unknown thing"


def test_variants_for():
    assert "burgundy" in variants_for("oxblood")
    assert variants_for("not-in-map") == ["not-in-map"]


def test_recency_weight_halves_every_14_days():
    as_of = parse_timestamp("2026-11-18T12:00:00.000Z")
    assert recency_weight("2026-11-18T12:00:00.000Z", as_of) == pytest.approx(1.0)
    assert recency_weight("2026-11-04T12:00:00.000Z", as_of) == pytest.approx(0.5)
    assert recency_weight("2026-10-21T12:00:00.000Z", as_of) == pytest.approx(0.25)


def test_growth_rate_guards_zero_previous():
    assert growth_rate(10, 0) == 1.0
    assert growth_rate(0, 0) == 0.0
    assert growth_rate(15, 10) == pytest.approx(0.5)


def test_classify_stage_rules():
    assert classify_stage(StageInputs(0.10, -0.25, 3)) == "dead"
    assert classify_stage(StageInputs(0.50, -0.20, 8)) == "declining"
    assert classify_stage(StageInputs(0.20, 0.50, 4)) == "emerging"
    assert classify_stage(StageInputs(0.80, 0.05, 9)) == "peak"
    assert classify_stage(StageInputs(0.50, 0.30, 8)) == "rising"


def test_forecast_declining_has_zero_weeks_to_peak():
    f = forecast_peak(
        ForecastInputs("color", "declining", -0.3, 0.5, 43)
    )
    assert f.weeks_to_peak == 0
    assert f.estimated_peak_score == 43


def test_forecast_peak_stage_is_one_week():
    f = forecast_peak(ForecastInputs("color", "peak", 0.0, 0.9, 63))
    assert f.weeks_to_peak == 1
    assert f.peak_window_end_weeks == 4  # color: window width 3


def test_typical_lifecycle_weeks():
    assert TYPICAL_LIFECYCLE_WEEKS == {
        "color": 10,
        "pattern": 8,
        "silhouette": 8,
        "item": 6,
        "fabric": 8,
        "aesthetic": 12,
    }
