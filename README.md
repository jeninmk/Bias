# Bias

> The bias cut in fashion meets bias in data.

A forecasting website that scores fashion trends from many sources and projects when each one will peak. Built as a portfolio project by Jenin Katbah, a full-stack engineer (Angular, TypeScript, Java, Spring Boot) moving into fashion technology.

## What it does

- **Scores trend candidates** — one attribute each: a color (oxblood),
  pattern (leopard), silhouette (oversized blazer), item (ballet flats),
  fabric (sheer), or aesthetic (eclectic maximalist).
- **Pulls signals from 17 source categories** — TikTok, X/Twitter,
  Instagram, Pinterest, resale demand (Depop, ThredUp, Vinted, eBay…),
  runway, editorial, Pantone/WGSN, Google Trends, retail new-in, Lyst
  Index, street style, Reddit, festival culture, YouTube, e-commerce
  search, and trend services (Tagwalk, Heuritech).
- **Ranks trends by a weighted Trend Score (0–100)** and classifies
  each one's lifecycle stage (emerging / rising / peak / declining /
  dead), with a projected peak window in weeks.

## How the algorithm works (brief)

```
Trend Score = 0.30*velocity + 0.20*volume + 0.20*breadth
            + 0.10*sentiment + 0.10*resale + 0.10*authority
```

- **velocity** — week-over-week growth; **volume** — recency-decayed
  mentions, log-normalized; **breadth** — distinct source categories
  observing the trend (cross-source confirmation is the strongest
  signal); **sentiment** — positive share of social mentions;
  **resale** — resale price premium vs retail plus sell-through;
  **authority** — runway/editorial/color-authority weight.
- Observations decay exponentially with a **14-day half-life**.
- Raw terms are normalized through a synonym map (burgundy, cherry
  red, wine → oxblood).
- Full spec: [`docs/algorithm.md`](docs/algorithm.md). Source catalog
  and access notes: [`docs/sources.md`](docs/sources.md).

## How to run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

## Project layout

```
src/engine/        Pure scoring engine: types, synonyms, normalize,
                   score, lifecycle, forecast (no I/O, no network)
src/collectors/    One collector per source category, same interface.
                   Manual-entry collector is live; the other 17 are
                   documented stubs with access notes.
src/data/          seed-observations.json — curated observations for
                   12 trends over 8 weeks (regenerate with
                   `node scripts/generate-seed.mjs`)
src/lib/           Dashboard data layer: loads the seed data, runs the
                   engine, exposes ranked trends + breakdowns
src/app/           Next.js dashboard: ranking, trend detail, colors,
                   methodology
docs/              algorithm.md, sources.md
```

## Data status (v1)

The dashboard runs on **curated seed data** (433 observations, 12
trends, 8 weeks). X/TikTok/Pinterest APIs are gated and resale sites
block scraping, so live feeds are not wired up yet. The engine is
real; the data is a stand-in until collectors get access. See
`docs/sources.md` for what to connect first (editorial RSS is free).

## Roadmap

- [ ] Editorial RSS poller (Vogue, ELLE, BoF, WWD, Hypebeast,
      Highsnobiety, The Cut, Who What Wear) — first live feed
- [ ] YouTube Data API v3 keyword job
- [ ] eBay Browse API for resale price/sell-through
- [ ] Manual-entry form so new observations do not need a JSON edit
- [ ] Seasonality: separate seasonal spikes (fall colors) from durable shifts
- [ ] Backtesting: score past seasons against what actually peaked
- [ ] Database (Postgres) + weekly cron to replace the seed file
