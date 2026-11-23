# Bias — Architecture (v2)

> The bias cut in fashion meets bias in data.

Bias forecasts fashion trends from social, runway, editorial, resale,
retail, and search signals. This document describes the v2 system
(SvelteKit + FastAPI + PostgreSQL). The v1 app (Next.js, `src/`) is
kept in the repo as legacy and is not served.

## System diagram (text)

```
                    +------------------+
                    |  GitHub Actions  |  weekly cron
                    |  (ingest.yml)    |
                    +--------+---------+
                             | POST /api/ingest/rss
                             | header X-Ingest-Key (GitHub Secret)
                             v
  +------------------+   +-------------------+   +------------------+
  | Cloudflare Pages |   |  FastAPI (Render) |   | Neon PostgreSQL  |
  | SvelteKit frontend|-->|  backend/app      |-->| observations,    |
  | (static + SPA)   |   |  engine, API,     |   | scores, runs     |
  +------------------+   |  collectors       |   +------------------+
        ^                +-------------------+
        |                         |
        | reads only              | reads keys from env vars only
        | PUBLIC_API_URL          v
        |                +-------------------+
        |                | Outside services  |
        |                | RSS feeds, YouTube|
        |                | Data API, eBay    |
        |                | Browse API        |
        |                +-------------------+
```

## Components

### `frontend/` — SvelteKit (Svelte 5) + TypeScript + Tailwind

A thin display layer. It holds no secrets and no scoring logic; it
fetches ranked trends, trend detail, colors, and methodology from the
backend API. The backend base URL comes from the public env var
`PUBLIC_API_URL` (default `http://localhost:8000` for local dev).
If the backend is unreachable, pages show an empty state and tell the
reader to start the API server. Hosted on Cloudflare Pages (free tier).

### `backend/` — FastAPI (Python 3.12) + Pydantic + SQLAlchemy

Owns everything that must stay server-side:

- `backend/app/engine/` — the scoring engine, pure functions with no
  I/O, ported 1:1 from the v1 TypeScript engine (`src/engine/`).
  Formula: `Trend Score = 0.30*velocity + 0.20*volume + 0.20*breadth
  + 0.10*sentiment + 0.10*resale + 0.10*authority`, components
  normalized 0–100 first, 14-day half-life recency decay, synonym
  normalization, lifecycle stages (emerging / rising / peak /
  declining / dead), and a peak forecast window.
- `backend/app/models.py` — SQLAlchemy models: `Observation`,
  `TrendScore`, `IngestionRun`.
- `backend/app/main.py` — the API: `GET /health`,
  `GET /api/trends`, `GET /api/trends/{slug}`, `GET /api/colors`,
  `GET /api/methodology`, `POST /api/ingest/rss`.
- `backend/app/collectors/` — one collector per source category,
  sharing a common interface. The editorial RSS collector is live;
  YouTube and eBay collectors are stubs that read keys from env vars
  and fail clearly when keys are absent.
- Hosted on Render (free tier). API keys live only in Render env
  vars; the browser never sees them.

### Database — PostgreSQL (Neon)

Stores observations, computed scores, and ingestion runs. Local dev
uses SQLite; production uses Neon via `DATABASE_URL`. Schema is
created with SQLAlchemy `create_all` in v1; Alembic migrations are
the follow-up.

### Scheduler — GitHub Actions

`.github/workflows/ingest.yml` runs weekly and calls
`POST /api/ingest/rss` on the Render backend, authenticating with a
shared secret stored as a GitHub Secret (`BIAS_INGEST_KEY`) and the
backend URL as another secret (`BIAS_API_URL`). No URLs or keys are
hardcoded in the workflow.

## Data flow

1. Collectors fetch outside data (RSS feeds now; YouTube/eBay later)
   and turn it into observations (attribute, source, timestamp,
   volume, sentiment, optional price data).
2. Observations are stored in Postgres, then the engine scores every
   canonical attribute: components, Trend Score, lifecycle stage,
   confidence, forecast. Scores are stored in `TrendScore`.
3. The frontend fetches the stored scores and renders ranking,
   detail, colors, and methodology pages.
4. The seed dataset (`src/data/seed-observations.json`, 433
   observations across 12 trends) is the stand-in until live
   collectors run; `backend` ships a seed script for it.

## Where secrets live

Nowhere in the repo. See [security.md](security.md) for the full
rules. In short: API keys and the ingest shared secret live only in
Render env vars, Cloudflare Pages env vars, and GitHub Secrets.
The frontend has no secrets at all.

## What changed from v1

| v1 (legacy, `src/`) | v2 (`frontend/` + `backend/`) |
|---|---|
| Next.js 14 + TypeScript | SvelteKit + TypeScript |
| Scoring in the browser build | Scoring in FastAPI (Python port) |
| Seed JSON file as the data store | Postgres (Neon); SQLite locally |
| No collectors running | RSS collector live; YouTube/eBay stubbed |
| Vercel (not used in v2) | Cloudflare Pages + Render |
| No scheduled ingestion | GitHub Actions weekly cron |

The algorithm, the docs, the seed data, and the name are unchanged.
