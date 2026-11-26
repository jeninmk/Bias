"""Editorial RSS collector (WORKING).

Fetches recent articles from fashion editorial RSS feeds, matches article
titles/descriptions against the known attribute vocabulary (the synonym
map), and yields one observation per (article, canonical attribute)
match with ``source_category='editorial'``.

Matching is intentionally conservative: a variant must appear as a
whole word/phrase in the title or description (case-insensitive).
Volume is 1 per matching article. An article mentioning a trend is one
editorial sighting. Sentiment is 0.0 (neutral): v1 does no sentiment
analysis on article text; the engine's sentiment component therefore
treats these as neutral until a classifier is added.

Feed URLs (checked 2026-11-23):
- Hypebeast https://hypebeast.com/feed: VERIFIED live (fetched and
  returned current articles).
- Vogue https://www.vogue.com/feed/rss: the publication's main RSS URL;
  could NOT be verified through the text fetcher used for the check
  (fetcher reported the page as not found, which does not prove the
  feed is dead. Vogue bot-blocks some readers). If feedparser gets
  nothing from it, the collector logs the failure and continues.
- Business of Fashion https://www.businessoffashion.com/feed/: the
  publication\'s main RSS URL; the text fetcher got HTTP 403 (BoF
  bot-blocks non-browser readers), so it is unverified via that route.
  feedparser sends its own user agent and may succeed.
- WWD https://wwd.com/feed/: the publication's main RSS URL (WordPress
  feed); the text fetcher blocks the wwd.com domain by policy, so it
  is unverified via that route.
- ELLE https://www.elle.com/rss/: the publication's main RSS URL;
  unverified (not fetched during the check).
- Highsnobiety https://www.highsnobiety.com/feed/: the publication's
  main RSS URL; unverified (not fetched during the check).
- The Cut https://www.thecut.com/rss/: the publication's main RSS URL;
  unverified (not fetched during the check).
- Who What Wear https://www.whowhatwear.com/rss: the publication's
  main RSS URL; unverified (not fetched during the check).

A single dead feed never fails the run: per-feed errors are logged and
the collector continues with the remaining feeds. If a feed URL turns
out to be wrong, fix it here and note the change in the comment above.
"""

from __future__ import annotations

import hashlib
import html
import logging
import re
from datetime import datetime, timezone

import feedparser

from ..engine.normalize import normalize_attribute
from ..engine.synonyms import SYNONYM_MAP
from ..engine.types import Observation as EngineObservation
from .base import Collector

logger = logging.getLogger(__name__)

# (publication name, RSS feed URL)
FEEDS: list[tuple[str, str]] = [
    ("Vogue", "https://www.vogue.com/feed/rss"),
    ("ELLE", "https://www.elle.com/rss/"),
    ("Business of Fashion", "https://www.businessoffashion.com/feed/"),
    ("WWD", "https://wwd.com/feed/"),
    ("Hypebeast", "https://hypebeast.com/feed"),
    ("Highsnobiety", "https://www.highsnobiety.com/feed/"),
    ("The Cut", "https://www.thecut.com/rss/"),
    ("Who What Wear", "https://www.whowhatwear.com/rss"),
]

# Attribute type per canonical attribute, from the v1 seed data taxonomy.
ATTRIBUTE_TYPES: dict[str, str] = {
    "oxblood": "color",
    "chocolate brown": "color",
    "butter yellow": "color",
    "navy": "color",
    "forest green": "color",
    "leopard print": "pattern",
    "plaid": "pattern",
    "polka dots": "pattern",
    "zebra print": "pattern",
    "gingham": "pattern",
    "stripes": "pattern",
    "sheer": "fabric",
    "lace": "fabric",
    "denim": "fabric",
    "oversized blazer": "silhouette",
    "ballet flats": "item",
    "moto jacket": "item",
    "barrel jeans": "item",
    "pencil skirt": "item",
    "maxi skirt": "item",
    "eclectic maximalist": "aesthetic",
    "quiet luxury": "aesthetic",
    "office siren": "aesthetic",
    "balletcore": "aesthetic",
    "coastal grandmother": "aesthetic",
}

# Precompiled whole-word/phrase matchers, longest variant first so
# "leopard print" wins over "leopard" for the same canonical.
_VARIANT_PATTERNS: list[tuple[str, str, re.Pattern]] = []
for _canonical, _variants in SYNONYM_MAP.items():
    for _variant in sorted(_variants, key=len, reverse=True):
        _VARIANT_PATTERNS.append(
            (_canonical, _variant, re.compile(r"\b" + re.escape(_variant.lower()) + r"\b"))
        )


def match_attributes(text: str) -> dict[str, str]:
    """Return {canonical_attribute: matched raw variant} for every
    vocabulary term found in ``text`` (title + description)."""
    lowered = text.lower()
    found: dict[str, str] = {}
    for canonical, variant, pattern in _VARIANT_PATTERNS:
        if canonical not in found and pattern.search(lowered):
            found[canonical] = variant
    return found


def _clean_text(value: str | None) -> str:
    if not value:
        return ""
    text = re.sub(r"<[^>]+>", " ", value)
    return html.unescape(text)


_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif")


def _looks_like_image(url: str) -> bool:
    """True for a URL that points at an image file (query string ignored)."""
    path = url.split("?", 1)[0].lower()
    return path.endswith(_IMAGE_EXTENSIONS)


def extract_image_url(entry: dict) -> str | None:
    """First usable image URL from a feedparser entry, if any.

    Checks, in order: ``media:content``, ``media:thumbnail``, enclosures
    with an image MIME type, enclosure links, then the first ``<img>``
    in the entry's HTML content or summary (how most WordPress feeds,
    Hypebeast included, carry their lead image). Returns None when the
    entry carries no image. The trend then renders a typographic cover
    instead of an invented picture.
    """
    for media in entry.get("media_content") or []:
        url = media.get("url")
        media_type = (media.get("type") or "").lower()
        if url and (media_type.startswith("image/") or _looks_like_image(url)):
            return url
    for thumb in entry.get("media_thumbnail") or []:
        url = thumb.get("url")
        if url:
            return url
    for enc in entry.get("enclosures") or []:
        href = enc.get("href")
        if href and (enc.get("type") or "").lower().startswith("image/"):
            return href
    for link in entry.get("links") or []:
        if link.get("rel") == "enclosure":
            href = link.get("href")
            if href and (link.get("type") or "").lower().startswith("image/"):
                return href
    html_parts = [c.get("value", "") for c in entry.get("content") or []]
    html_parts.append(entry.get("summary") or "")
    for part in html_parts:
        match = re.search(r'<img[^>]+src="([^"]+)"', part or "")
        if match:
            return html.unescape(match.group(1))
    return None


def _entry_timestamp(entry: dict) -> datetime:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        return datetime(*parsed[:6], tzinfo=timezone.utc)
    return datetime.now(timezone.utc)


class RSSCollector(Collector):
    source = "rss"
    source_category = "editorial"

    def __init__(self, feeds: list[tuple[str, str]] | None = None):
        self.feeds = feeds if feeds is not None else FEEDS

    def collect(self) -> list[EngineObservation]:
        observations: list[EngineObservation] = []
        for name, url in self.feeds:
            try:
                parsed = feedparser.parse(url)
            except Exception as exc:  # noqa: BLE001 - one bad feed must not kill the run
                logger.warning("RSS feed failed for %s (%s): %s", name, url, exc)
                continue
            if getattr(parsed, "bozo", False) and not getattr(parsed, "entries", None):
                logger.warning(
                    "RSS feed unreadable for %s (%s): %s",
                    name,
                    url,
                    getattr(parsed, "bozo_exception", "unknown error"),
                )
                continue
            for entry in parsed.entries or []:
                title = _clean_text(entry.get("title"))
                summary = _clean_text(entry.get("summary") or entry.get("description"))
                text = f"{title} {summary}"
                matches = match_attributes(text)
                if not matches:
                    continue
                link = entry.get("link", "")
                ts = _entry_timestamp(entry)
                image_url = extract_image_url(entry)
                for canonical, variant in matches.items():
                    digest = hashlib.md5(
                        f"{link}|{canonical}".encode("utf-8")
                    ).hexdigest()[:16]
                    observations.append(
                        EngineObservation(
                            id=f"rss-{digest}",
                            attribute=variant,
                            attribute_type=ATTRIBUTE_TYPES.get(
                                canonical, normalize_attribute(canonical)
                            ),
                            canonical_attribute=canonical,
                            source=f"{name} RSS",
                            source_category="editorial",
                            timestamp=ts.isoformat(),
                            volume=1,
                            sentiment=0.0,
                            image_url=image_url,
                            article_url=link or None,
                            article_title=title or None,
                            image_source=name if image_url else None,
                        )
                    )
        return observations


def run_ingest(db) -> dict:
    """Run the RSS collector: fetch, write observations to the DB,
    recompute scores, and record an IngestionRun."""
    return RSSCollector().run_ingest(db)
