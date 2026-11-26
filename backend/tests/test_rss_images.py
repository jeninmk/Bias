"""RSS collector image capture: picking an image from a feed entry and
attaching it (with article credit) to the observations it produces.
"""

from __future__ import annotations

from app.collectors.rss import RSSCollector, extract_image_url


def test_extract_image_prefers_media_content():
    entry = {
        "media_content": [
            {"url": "https://cdn.example.com/lead.jpg", "type": "image/jpeg"},
            {"url": "https://cdn.example.com/video.mp4", "type": "video/mp4"},
        ],
        "media_thumbnail": [{"url": "https://cdn.example.com/thumb.jpg"}],
    }
    assert extract_image_url(entry) == "https://cdn.example.com/lead.jpg"


def test_extract_image_falls_back_to_thumbnail_then_enclosure():
    assert (
        extract_image_url({"media_thumbnail": [{"url": "https://x.com/t.jpg"}]})
        == "https://x.com/t.jpg"
    )
    assert (
        extract_image_url(
            {"enclosures": [{"href": "https://x.com/e.png", "type": "image/png"}]}
        )
        == "https://x.com/e.png"
    )
    # A non-image enclosure is ignored.
    assert (
        extract_image_url(
            {"enclosures": [{"href": "https://x.com/e.mp3", "type": "audio/mpeg"}]}
        )
        is None
    )


def test_extract_image_returns_none_without_images():
    assert extract_image_url({}) is None
    assert extract_image_url({"title": "No image here"}) is None


def test_extract_image_from_html_content():
    """WordPress-style feeds embed the lead image as an <img> in the
    HTML content or summary, with no media:content at all."""
    entry = {
        "content": [
            {
                "value": '<p><img src="https://image-cdn.hypb.st/https%3A%2F%2Fx.com%2Fa.png?w=800&amp;q=90" /></p>'
            }
        ],
        "summary": "<p>Text only.</p>",
    }
    assert extract_image_url(entry) == (
        "https://image-cdn.hypb.st/https%3A%2F%2Fx.com%2Fa.png?w=800&q=90"
    )
    assert (
        extract_image_url({"summary": '<p><img src="https://x.com/s.jpg"></p>'})
        == "https://x.com/s.jpg"
    )


def test_collector_attaches_image_and_credit(monkeypatch):
    """A matching article with an image yields observations carrying the
    image URL, article link/title, and publication name."""

    class FakeParsed:
        bozo = False
        entries = [
            {
                "title": "Polka dots are back on the runway",
                "summary": "The polka dots trend dominates the shows.",
                "link": "https://www.vogue.com/article/polka-dots",
                "published_parsed": (2026, 11, 16, 10, 0, 0, 0, 0, 0),
                "media_content": [
                    {"url": "https://vogue.com/img.jpg", "type": "image/jpeg"}
                ],
            },
            {
                "title": "Something unrelated",
                "summary": "No trend vocabulary in here.",
                "link": "https://www.vogue.com/article/other",
                "published_parsed": (2026, 11, 16, 10, 0, 0, 0, 0, 0),
            },
        ]

    import feedparser

    monkeypatch.setattr(feedparser, "parse", lambda url: FakeParsed())
    collector = RSSCollector(feeds=[("Vogue", "https://www.vogue.com/feed/rss")])
    observations = collector.collect()
    assert len(observations) == 1
    obs = observations[0]
    assert obs.canonical_attribute == "polka dots"
    assert obs.image_url == "https://vogue.com/img.jpg"
    assert obs.article_url == "https://www.vogue.com/article/polka-dots"
    assert obs.article_title == "Polka dots are back on the runway"
    assert obs.image_source == "Vogue"


def test_ingest_persists_cover_image(seeded_client, monkeypatch):
    """End to end: an ingest run with an article image stores a
    TrendImage row, and the API serves it as the trend's cover."""
    import feedparser

    from app import config

    class FakeParsed:
        bozo = False
        entries = [
            {
                "title": "Oxblood everywhere this season",
                "summary": "Oxblood coats lead the fall collections.",
                "link": "https://www.elle.com/article/oxblood",
                "published_parsed": (2026, 11, 16, 10, 0, 0, 0, 0, 0),
                "media_thumbnail": [{"url": "https://elle.com/ox.jpg"}],
            }
        ]

    class EmptyParsed:
        bozo = False
        entries = []

    def fake_parse(url: str):
        # Only the ELLE feed carries the matching article; the other
        # feeds return nothing, like a real run.
        if "elle.com" in url:
            return FakeParsed()
        return EmptyParsed()

    monkeypatch.setattr(feedparser, "parse", fake_parse)
    monkeypatch.setattr(config, "INGEST_KEY", "test-secret")
    r = seeded_client.post("/api/ingest/rss", headers={"X-Ingest-Key": "test-secret"})
    assert r.status_code == 200
    assert r.json()["observations_added"] == 1
    # Confirm the stored row through the API.
    r = seeded_client.get("/api/trends/oxblood")
    assert r.status_code == 200
    cover = r.json()["cover_image"]
    assert cover is not None
    assert cover["image_url"] == "https://elle.com/ox.jpg"
    assert cover["source"] == "ELLE"
