"""Staying-power snapshots and cover images on the trends API.

Seeding writes one snapshot row per trend for the scoring date, and
the API exposes each trend's staying power (weeks in the Top 5 /
Top 10, current Top 10 streak) plus its cover image (null until a
collector captures one).
"""

from __future__ import annotations

from app.models import TrendImage, TrendSnapshot


def test_seed_writes_one_snapshot_per_trend(seeded_client, tmp_path):
    # The seeded fixture already ran seed_db; check the snapshot rows
    # through a second seed into a fresh DB is not needed: the API
    # response carries the staying power computed from the snapshots.
    r = seeded_client.get("/api/trends")
    assert r.status_code == 200
    trends = r.json()["trends"]
    assert len(trends) == 12
    # Every trend has staying power from the seed snapshot: one
    # snapshot week, so the Top 5 / Top 10 counts are 0 or 1 and the
    # streak is 1 for the trends ranked in the Top 10.
    for t in trends:
        sp = t["staying_power"]
        assert sp is not None
        assert sp["weeks_in_top_5"] in (0, 1)
        assert sp["weeks_in_top_10"] in (0, 1)
        assert sp["current_streak_weeks"] in (0, 1)
    top = trends[0]
    assert top["canonical_attribute"] == "polka dots"
    assert top["staying_power"]["weeks_in_top_5"] == 1
    assert top["staying_power"]["current_streak_weeks"] == 1
    bottom = trends[-1]
    assert bottom["staying_power"]["weeks_in_top_5"] == 0


def test_staying_power_counts_multiple_snapshot_weeks(tmp_path):
    """Two scoring events a week apart accumulate Top 5 / Top 10 weeks."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.db import Base
    from app.main import _staying_power
    from app.seed import seed_db

    db_path = tmp_path / "snap.db"
    engine = create_engine(
        f"sqlite:///{db_path}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        seed_db(db)
        # Simulate a second scoring event one week later by moving the
        # first snapshot week's dates forward a week and re-seeding:
        # seed_db re-scores the same data, so move the existing rows
        # back 7 days, then seed again for a fresh snapshot date.
        from datetime import timedelta

        for row in db.query(TrendSnapshot).all():
            row.snapshot_date = row.snapshot_date - timedelta(days=7)
        db.commit()
        seed_db(db)
        sp = _staying_power(db, "polka dots")
        assert sp is not None
        assert sp.weeks_in_top_5 == 2
        assert sp.weeks_in_top_10 == 2
        assert sp.current_streak_weeks == 2
        # Re-seeding the same date must not duplicate that date's rows.
        seed_db(db)
        count = (
            db.query(TrendSnapshot)
            .filter(TrendSnapshot.canonical_attribute == "polka dots")
            .count()
        )
        assert count == 2
    finally:
        db.close()


def test_cover_image_null_until_captured(seeded_client):
    r = seeded_client.get("/api/trends/polka-dots")
    assert r.status_code == 200
    assert r.json()["cover_image"] is None


def test_cover_image_served_when_stored(seeded_client, tmp_path):
    """A stored cover image is served with its publication credit."""
    from datetime import datetime, timezone

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    # The fixture seeds tmp_path / "test.db"; open a second session on
    # the same file to store a cover image, then read it via the API.
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        db.merge(
            TrendImage(
                canonical_attribute="polka dots",
                image_url="https://example.com/polka.jpg",
                image_source="Vogue",
                article_url="https://example.com/article",
                article_title="Polka dots return",
                captured_at=datetime.now(timezone.utc),
            )
        )
        db.commit()
    finally:
        db.close()
    r = seeded_client.get("/api/trends/polka-dots")
    assert r.status_code == 200
    cover = r.json()["cover_image"]
    assert cover["image_url"] == "https://example.com/polka.jpg"
    assert cover["source"] == "Vogue"
    assert cover["article_title"] == "Polka dots return"
