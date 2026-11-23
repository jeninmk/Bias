# Forecasting algorithm

The engine answers one question: **which fashion attributes are about
to peak, and how confident are we?** A trend candidate is one attribute:
a color (oxblood), pattern (leopard), silhouette (oversized blazer),
item (ballet flats), fabric (sheer), or aesthetic (eclectic maximalist).

Everything in this document is implemented as pure TypeScript functions
in `src/engine/`. No I/O, no network, no database: observations in,
scored trends out.

## 1. Observations

One observation records:

| Field | Meaning |
|---|---|
| `attribute` | Raw term as it appeared, e.g. "burgundy" |
| `attributeType` | color / pattern / silhouette / item / fabric / aesthetic |
| `canonicalAttribute` | Normalized family, e.g. "oxblood" |
| `source` | Human-readable source, e.g. "TikTok #fashiontok" |
| `sourceCategory` | One of the 17 categories in the source catalog |
| `timestamp` | ISO 8601 timestamp of the observation window |
| `volume` | Mentions, searches, saves, listing counts, or look counts |
| `sentiment` | -1 (negative) to 1 (positive) |
| `price` | Optional resale evidence: avg resale price, retail price, sold count, sell-through rate |

## 2. Normalization

Different sources spell the same trend differently. A synonym map
(`src/engine/synonyms.ts`) collapses variants to one canonical family:

- cherry red / burgundy / wine / bordeaux → **oxblood**
- cocoa / mocha / espresso brown → **chocolate brown**
- leopard → **leopard print**, tartan → **plaid**, mesh → **sheer**

Both the raw term and the canonical family are kept on every
observation, so a detail page can show which spellings fed a trend.
Anything not in the map normalizes to its own lowercased, trimmed form.

## 3. Sources

17 source categories feed the engine (full catalog in `docs/sources.md`
and `src/collectors/`):

1. TikTok 2. X/Twitter 3. Instagram 4. Pinterest 5. Resale demand
   (Depop, ThredUp, Vinted, Poshmark, eBay, Grailed) 6. Runway (Vogue
   Runway, NY/London/Milan/Paris) 7. Editorial (Vogue, ELLE, Harper's
   Bazaar, BoF, WWD, Hypebeast, Highsnobiety, The Cut, Who What Wear)
2. Color authority (Pantone, WGSN) 9. Search (Google Trends, Pinterest
   Trends) 10. Retail new-in (Zara, H&M, ASOS, SSENSE, Net-a-Porter,
   Shopbop) 11. Lyst Index 12. Celebrity and street style 13. Reddit
   14. Music and festival culture 15. YouTube 16. E-commerce search
   (ShopStyle, Lyst) 17. Trend services (Tagwalk, Heuritech)

In v1 only the manual-entry collector is live, reading the curated
seed dataset. The other 17 are documented stubs with access notes.

## 4. Signals

Signals are computed per attribute over rolling weekly windows:

| Signal | Definition |
|---|---|
| volume | Total mentions/searches (recency-decayed) |
| velocity | Week-over-week growth rate of the latest complete week |
| acceleration | Change in velocity vs the previous week |
| breadth | Number of distinct source categories observing the trend |
| sentiment | Volume-weighted average sentiment over the last 4 weeks |
| price | Resale price premium vs retail, plus sell-through rate |
| authority | Share of recent volume from runway, editorial, and color-authority sources |
| recency | Exponential decay on older observations (half-life 14 days) |

**Recency decay.** An observation's weight is `0.5 ^ (ageDays / 14)`:
full weight today, half after 14 days, a quarter after 28. Decay
applies to volume, sentiment, and authority totals. Velocity uses RAW
weekly volumes, because decay would distort the growth rate.

**Velocity.** `growth = (thisWeek - lastWeek) / lastWeek`. A week with
zero previous volume and positive current volume scores as +100%
growth; two zero weeks score as 0%.

## 5. Scoring (0–100)

Each component is normalized to 0–100 **before** weighting, so no
signal dominates through raw units:

```
Trend Score = 0.30*velocity + 0.20*volume + 0.20*breadth
            + 0.10*sentiment + 0.10*resale + 0.10*authority
```

Component normalization:

- **velocity:** `clamp(50 + growthRate * 100, 0, 100)`. 0% growth
  scores 50, +50% scores 100, −50% scores 0.
- **volume:** `100 * ln(1 + decayedTotal) / ln(1 + maxDecayedTotal)`.
  Log scale, relative to the highest-volume trend in the dataset.
- **breadth:** `distinctCategories / 17 * 100`. Cross-source
  confirmation is the strongest signal: a trend on TikTok AND the
  runway AND resale is far more real than a TikTok-only spike.
- **sentiment:** `((avgSentiment + 1) / 2) * 100`.
- **resale:** `0.6 * premiumScore + 0.4 * sellThroughScore`, where
  `premiumScore = clamp(50 + premium * 100)` and `sellThroughScore =
  sellThroughRate * 100`. **50 (neutral) when no resale data exists.**
- **authority:** `clamp(authorityVolumeShare * 200, 0, 100)`. Scaled
  ×2 because authority sources are a small share of total volume but
  carry outsized early-signal value.

**Confidence (0–100)** = `0.5 * countScore + 0.5 * diversityScore`,
where `countScore = min(100, observationCount / 25 * 100)` and
`diversityScore = breadth / 17 * 100`. A score built on 30
observations across 9 sources is trusted more than one built on 4
observations from 1 source.

## 6. Lifecycle stages

The stage is read off the velocity curve and breadth, not from any
single week's volume:

| Stage | Rule |
|---|---|
| emerging | relative volume < 0.35, velocity > +25%, breadth ≤ 5 |
| rising | positive velocity, growing volume and breadth (default) |
| peak | relative volume ≥ 0.6, velocity within ±15% (growth flattening) |
| declining | velocity ≤ −15% |
| dead | relative volume ≤ 0.12 AND velocity ≤ −20% |

Relative volume is the trend's decayed total volume divided by the
highest-volume trend's decayed total.

## 7. Forecasting the peak

The projected peak window is estimated from the trend's position on
the velocity curve and the typical lifecycle length of its attribute
type:

| Attribute type | Typical lifecycle |
|---|---|
| color | 10 weeks |
| pattern | 8 weeks |
| silhouette | 8 weeks |
| item | 6 weeks |
| fabric | 8 weeks |
| aesthetic | 12 weeks |

Colors and aesthetics run longer than micro-trends on single items.

```
weeksToPeak = typicalLifecycle * (1 - relativeVolume)   (clamped 1–12)
```

A trend already at peak is ~1 week from its highest point. The peak
window is wider for slow-burn types (color, aesthetic: +3 weeks) and
narrower for fast ones (+2 weeks). Estimated peak score grows with
current velocity: `trendScore * (1 + max(0, velocityRate) * 0.25)`,
capped at 100. Declining and dead trends have already peaked, so
their window is 0.

## 8. Limitations (read before trusting a score)

- **v1 data is curated seed data**, not live feeds. Scores describe
  the seed dataset, not the real world, until collectors are wired up.
- **Volume is not comparable across source types.** A TikTok view and
  a runway look are different units; the engine treats them as
  mentions and relies on breadth to balance that out. Treat volume
  as directional, not absolute.
- **Sentiment is a blunt average.** It does not distinguish "people
  love wearing it" from "people love arguing about it."
- **Resale data is thin.** Only some trends have price evidence, and
  a 50 (neutral) fills the gap for the rest. A trend with no resale
  data is not penalized, but it is also not confirmed by buyers.
- **The peak forecast is a heuristic**, not a statistical model. It
  assumes a single rise-and-fall lifecycle; real trends plateau,
  revive, and get killed by a celebrity wearing something else.
- **No seasonality.** A trend peaking in November may be a seasonal
  (fall color) rather than a durable shift. The engine does not yet
  know the difference.
