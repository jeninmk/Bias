"""API tests: one test per endpoint, against a seeded SQLite DB
(via TestClient), plus the empty-DB behaviour and ingest auth.
"""

from __future__ import annotations

import pytest

from app import config
from app.collectors import rss as rss_module
from app.collectors.ebay import EbayCollector
from app.collectors.rss import match_attributes
from app.collectors.youtube import YouTubeCollector
from app.engine.types import Observation as EngineObservation


def test_health(seeded_client):
    r = seeded_client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_list_trends_returns_12_ranked_trends(seeded_client):
    r = seeded_client.get("/api/trends")
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == 12
    assert len(body["trends"]) == 12
    scores = [t["score"]["trend_score"] for t in body["trends"]]
    assert scores == sorted(scores, reverse=True)
    first = body["trends"][0]
    assert first["canonical_attribute"] == "polka dots"
    assert first["score"]["trend_score"] == pytest.approx(72, abs=1)
    assert first["stage"] == "emerging"
    # ScoredTrend fields are all present (snake_case).
    for field in (
        "canonical_attribute",
        "attribute_type",
        "score",
        "stage",
        "observation_count",
        "source_categories",
        "total_volume",
        "latest_week_volume",
        "previous_week_volume",
        "velocity_rate",
        "acceleration_rate",
        "relative_volume",
        "forecast",
    ):
        assert field in first, f"missing field {field}"
    for component in (
        "trend_score",
        "velocity",
        "volume",
        "breadth",
        "sentiment",
        "resale",
        "authority",
        "confidence",
    ):
        assert component in first["score"]
    assert set(first["forecast"]) == {
        "weeks_to_peak",
        "peak_window_start_weeks",
        "peak_window_end_weeks",
        "estimated_peak_score",
    }


def test_list_trends_empty_db_returns_empty_list_with_message(empty_client):
    r = empty_client.get("/api/trends")
    assert r.status_code == 200
    body = r.json()
    assert body["trends"] == []
    assert body["count"] == 0
    assert body["message"]


def test_trend_detail(seeded_client):
    r = seeded_client.get("/api/trends/oxblood")
    assert r.status_code == 200
    body = r.json()
    assert body["canonical_attribute"] == "oxblood"
    assert body["attribute_type"] == "color"
    assert body["stage"] == "peak"
    assert body["score"]["trend_score"] == pytest.approx(63, abs=1)
    assert len(body["weekly_volumes"]) == 8
    assert body["weekly_volumes"][0]["week"] <= body["weekly_volumes"][-1]["week"]
    assert sum(w["volume"] for w in body["weekly_volumes"]) > 0
    assert body["source_breakdown"], "expected per-source breakdown"
    total_share = sum(s["volume_share"] for s in body["source_breakdown"])
    assert total_share == pytest.approx(1.0, abs=0.01)
    assert all(s["observation_count"] > 0 for s in body["source_breakdown"])


def test_trend_detail_unknown_slug_404(seeded_client):
    r = seeded_client.get("/api/trends/not-a-trend")
    assert r.status_code == 404


def test_colors(seeded_client):
    r = seeded_client.get("/api/colors")
    assert r.status_code == 200
    body = r.json()
    names = {c["canonical_attribute"] for c in body}
    assert names == {"oxblood", "chocolate brown", "butter yellow"}
    for c in body:
        assert c["attribute_type"] == "color"
        assert c["palette"], f"no palette for {c['canonical_attribute']}"
        assert all(p.startswith("#") for p in c["palette"])


def test_colors_empty_db(empty_client):
    r = empty_client.get("/api/colors")
    assert r.status_code == 200
    assert r.json() == []


def test_methodology(seeded_client):
    r = seeded_client.get("/api/methodology")
    assert r.status_code == 200
    body = r.json()
    # The scoring recipe is private: no formula, weights, normalizations,
    # or thresholds anywhere in the response.
    assert "formula" not in body
    assert "weights" not in body
    assert "normalization" not in r.text
    assert "0.30" not in r.text
    assert {s["name"] for s in body["signals"]} >= {
        "velocity",
        "volume",
        "breadth",
        "sentiment",
        "resale",
        "authority",
        "confidence",
    }
    stages = {s["stage"] for s in body["lifecycle_stages"]}
    assert stages == {"emerging", "rising", "peak", "declining", "dead"}
    assert body["hashtags"] == ["#fashiontok", "#ootd"]
    assert len(body["source_categories"]) == 17


def test_ingest_rss_requires_key(seeded_client, monkeypatch):
    monkeypatch.setattr(config, "INGEST_KEY", "test-secret")
    r = seeded_client.post("/api/ingest/rss")
    assert r.status_code == 401
    r = seeded_client.post("/api/ingest/rss", headers={"X-Ingest-Key": "wrong"})
    assert r.status_code == 401


def test_ingest_rss_success_with_mocked_collector(seeded_client, monkeypatch):
    monkeypatch.setattr(config, "INGEST_KEY", "test-secret")

    def fake_collect(self):
        return [
            EngineObservation(
                id="rss-test-1",
                attribute="burgundy",
                attribute_type="color",
                canonical_attribute="oxblood",
                source="Vogue RSS",
                source_category="editorial",
                timestamp="2026-11-18T12:00:00.000Z",
                volume=1,
                sentiment=0.0,
            )
        ]

    monkeypatch.setattr(rss_module.RSSCollector, "collect", fake_collect)
    r = seeded_client.post("/api/ingest/rss", headers={"X-Ingest-Key": "test-secret"})
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "rss"
    assert body["observations_added"] == 1
    assert body["status"] == "success"


def test_ingest_rss_unconfigured_returns_503(seeded_client, monkeypatch):
    monkeypatch.setattr(config, "INGEST_KEY", "")
    r = seeded_client.post(
        "/api/ingest/rss", headers={"X-Ingest-Key": "anything"}
    )
    assert r.status_code == 503


def test_rss_matcher():
    # "burgundy" is the first matching variant in length-descending order.
    assert match_attributes("Oxblood and burgundy dominate the runway") == {
        "oxblood": "burgundy"
    }
    assert match_attributes("Polka dots are back, plus sheer fabrics") == {
        "polka dots": "polka dots",
        "sheer": "sheer fabrics",
    }
    assert match_attributes("Nothing relevant here at all") == {}


def test_youtube_stub_requires_key(monkeypatch):
    monkeypatch.delenv("YOUTUBE_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="YOUTUBE_API_KEY"):
        YouTubeCollector(api_key="").collect()


def test_ebay_stub_requires_keys(monkeypatch):
    monkeypatch.delenv("EBAY_CLIENT_ID", raising=False)
    monkeypatch.delenv("EBAY_CLIENT_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="EBAY_CLIENT_ID"):
        EbayCollector(client_id="", client_secret="").collect()
