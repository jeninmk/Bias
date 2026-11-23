# Source catalog

What each source contributes, and how to get access. Honest version:
**X, TikTok, and Pinterest APIs are gated; resale sites block
scraping; WGSN and Heuritech are paid B2B.** That is why v1 runs on
curated seed data and manual entry, and why the collectors in
`src/collectors/` are stubs with access notes instead of live
integrations.

Status key: **live** (implemented), **rss** (free feed, implementable
now), **gated** (needs application/approval), **paid** (subscription),
**manual** (human entry only).

| # | Source | Category | Contributes | Access | Status |
|---|---|---|---|---|---|
| 1 | TikTok | tiktok | Trending hashtags, captions, comments; keywords, colors, patterns; engagement velocity | TikTok Research API (gated application) | gated |
| 2 | X / Twitter | twitter | Hashtags, mentions, quote posts; sentiment around runway looks | X API v2 (paid Basic tier) | gated |
| 3 | Instagram | instagram | Reels, hashtags, influencer posts | Instagram Graph API (approved app) | gated |
| 4 | Pinterest | pinterest | Popular pins, board saves, Pinterest Trends search terms | Pinterest API v5 (approved app); Trends has no bulk API | gated |
| 5 | Resale demand: Depop, ThredUp, Vinted, Poshmark, eBay, Grailed | resale | Search keywords, listing counts, sold prices, sell-through velocity — the demand signal people put money behind | eBay Browse API (approved app); Depop/ThredUp/Vinted block scraping | manual + eBay |
| 6 | Runway: Vogue Runway, NY/London/Milan/Paris fashion weeks | runway | Look counts per attribute — the earliest authority signal | Public pages; Tagwalk (licensed) | manual |
| 7 | Editorial: Vogue, ELLE, Harper's Bazaar, BoF, WWD, Hypebeast, Highsnobiety, The Cut, Who What Wear | editorial | Article frequency and framing — the mainstreaming signal | RSS feeds (free) | rss |
| 8 | Color authority: Pantone Color of the Year, Pantone Fashion Color Trend Report, WGSN | color-authority | Seasonal palettes; strongest early signal for colors | Pantone public reports; WGSN paid subscription | manual |
| 9 | Search: Google Trends, Pinterest Trends | search | Keyword interest over time — intent that precedes buying | No official API; pytrends is unofficial | manual |
| 10 | Retail new-in: Zara, H&M, ASOS, SSENSE, Net-a-Porter, Shopbop | retail | New-arrival attributes and sell-out speed — commercial confirmation | No public API; scraping against ToS | manual |
| 11 | Lyst Index | lyst | Quarterly hottest brands and products | Public quarterly report | manual |
| 12 | Celebrity and street style | celebrity | Red carpet and street-style sightings | No public API | manual |
| 13 | Reddit: r/femalefashionadvice, r/streetwear, r/fashion | reddit | Discussion volume and sentiment; enthusiast early adoption | Reddit API free tier (rate-limited); subreddit RSS | rss |
| 14 | Music and festival culture | music | Festival outfits, music-video styling; a trend accelerant | No public API | manual |
| 15 | YouTube | youtube | Hauls, trend roundups, try-ons; view counts | YouTube Data API v3 (free tier, quota-limited) | gated |
| 16 | E-commerce search: ShopStyle, Lyst | ecommerce-search | Shopping-intent search terms, one step from purchase | No public API | manual |
| 17 | Trend services: Tagwalk, Heuritech | trend-service | Runway search data; AI-tagged attributes in social photos | Paid B2B subscriptions | paid |

## What to wire up first

1. **Editorial RSS** — free, stable, no approval. Headlines from
   Vogue, ELLE, BoF, WWD, Hypebeast, Highsnobiety, The Cut, and Who
   What Wear, matched against the synonym map. This alone gives the
   engine a live mainstreaming signal.
2. **YouTube Data API v3** — free tier, one API key. Search a fixed
   keyword list weekly for hauls and trend videos.
3. **Reddit RSS** — free per-subreddit feeds for
   r/femalefashionadvice, r/streetwear, r/fashion.
4. **eBay Browse API** — the one automatable resale source. Sold
   listings give real price and sell-through data.
5. **Manual entry habit** — until the gated APIs (TikTok Research,
   X, Pinterest, Instagram) approve access, a weekly 30-minute pass
   over TikTok trends, Depop/Vinted search, and Pinterest Trends,
   logged into the seed file, keeps the data fresh.

## What not to do

- Do not scrape Depop, ThredUp, Vinted, Zara, or H&M. They run bot
  detection and it violates their terms; accounts and IPs get banned.
- Do not rely on pytrends for production: it is an unofficial wrapper
  around Google Trends and breaks without warning.
- Do not pay for WGSN or Heuritech until the free sources are live
  and the engine is validated against a full season of real data.
