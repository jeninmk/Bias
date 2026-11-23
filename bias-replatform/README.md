# Bias

> The bias cut in fashion meets bias in data.

A forecasting website that scores fashion trends from many sources and projects when each one will peak. Built as a portfolio project by Jenin Katbah, a full-stack engineer (Angular, TypeScript, Java, Spring Boot) moving into fashion technology.

## Stack (v2)

- **Frontend:** SvelteKit (Svelte 5) + TypeScript + Tailwind CSS — `frontend/`
- **Backend:** FastAPI (Python 3.12) + Pydantic + SQLAlchemy — `backend/`
- **Database:** PostgreSQL (Neon in production, SQLite for local dev)
- **Hosting:** Cloudflare Pages (frontend) + Render (backend)
- **Ingestion:** GitHub Actions weekly cron

The v1 app (Next.js 14, `src/`) is kept in the repo as legacy and is
not served. See [docs/architecture.md](docs/architecture.md) for the
system design, [docs/deploy.md](docs/deploy.md) for hosting setup,
and [docs/security.md](docs/security.md) for where secrets live.

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

## How to run locally

```bash
# Backend (from the repo root)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in DATABASE_URL for Postgres, or leave unset for SQLite
python scripts/seed_db.py   # loads the seed observations and computes scores
uvicorn app.main:app --reload   # http://localhost:8000

# Frontend (from the repo root)
cd frontend
npm install
npm run dev                 # http://localhost:5173
npm run build               # static build in build/ (no backend needed)
```

## Project layout

```
frontend/          SvelteKit app: ranking, trend detail, colors, methodology
                   (thin display layer; fetches from the FastAPI backend)
backend/           FastAPI app
  app/engine/      Scoring engine, pure functions, ported 1:1 from the
                   v1 TypeScript engine (same formula, same tests)
  app/collectors/  Editorial RSS collector (live); YouTube/eBay stubs
  app/models.py    SQLAlchemy models: Observation, TrendScore, IngestionRun
  tests/           Parity tests vs the v1 engine + API tests (pytest)
src/               v1 LEGACY Next.js app (engine, dashboard, collectors).
                   Kept for reference; not served. Do not build on it.
docs/              algorithm.md, sources.md, architecture.md,
                   security.md, deploy.md
scripts/           generate-seed.mjs — regenerates the seed dataset
.github/workflows/ ingest.yml — weekly editorial ingestion cron
render.yaml        Render blueprint for the backend service
```

## Data status

The dashboard runs on **curated seed data** (433 observations, 12
trends, 8 weeks). X/TikTok/Pinterest APIs are gated and resale sites
block scraping, so live feeds are not wired up yet. The engine is
real; the data is a stand-in until collectors get access. The
editorial RSS collector is the first live feed (see
`docs/sources.md`).

## Security

API keys live only in platform environment variables (Render,
Cloudflare Pages, GitHub Secrets) — never in code, never in the
browser bundle, never in git. See
[docs/security.md](docs/security.md).

## Roadmap

- [x] Editorial RSS collector (Vogue, ELLE, BoF, WWD, Hypebeast,
      Highsnobiety, The Cut, Who What Wear)
- [ ] YouTube Data API v3 keyword job (needs a key, server-side only)
- [ ] eBay Browse API for resale price/sell-through (needs keys)
- [ ] Manual-entry form so new observations do not need a JSON edit
- [ ] Seasonality: separate seasonal spikes (fall colors) from durable shifts
- [ ] Backtesting: score past seasons against what actually peaked
- [ ] Alembic migrations (currently SQLAlchemy `create_all`)
- [ ] Remove the v1 legacy Next.js app (`src/`) after review
