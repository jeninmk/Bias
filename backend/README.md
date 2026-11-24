# Bias backend — FastAPI + SQLAlchemy

Fashion trend forecasting API. Ports the v1 TypeScript scoring engine
(`../src/engine/`) to pure Python, serves scored trends from a database,
and ingests live editorial signal from RSS feeds.

## Stack

- Python 3.12, FastAPI + Pydantic, SQLAlchemy
- SQLite for local dev; Postgres via `DATABASE_URL`
- pytest for tests; slowapi for rate limiting; feedparser for RSS

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in INGEST_KEY at minimum
```

## Seed the database

Loads `../src/data/seed-observations.json` (433 observations, 12 trends)
and computes/stores trend scores:

```bash
python scripts/seed_db.py
# equivalent:
python -m app.seed
```

Re-running is idempotent: seed observations are upserted by id and
scores are recomputed.

## Run the server

```bash
uvicorn app.main:app --reload --port 8000
# http://localhost:8000/api/trends
```

## Run the tests

```bash
python -m pytest
```

Parity tests (`tests/test_engine_parity.py`) run the Python engine over
the seed data and assert the same scores (±1) and stages (exact) the
TypeScript engine produced. API tests (`tests/test_api.py`) exercise
every endpoint against a seeded SQLite DB via TestClient.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/api/trends` | ranked trends; empty list + message if DB is empty |
| GET | `/api/trends/{slug}` | detail: score breakdown, forecast, weekly volumes, per-source breakdown |
| GET | `/api/colors` | color trends with hex palettes |
| GET | `/api/methodology` | public methodology summary as JSON |
| POST | `/api/ingest/rss` | run the RSS collector; header `X-Ingest-Key: <INGEST_KEY>` |

CORS allows only `FRONTEND_ORIGIN` (default `http://localhost:5173`).
API routes are rate-limited (default 60 requests/minute per IP;
`RATE_LIMIT_PER_MINUTE` env var; ingest is 10/minute).

## Ingestion

- **RSS (working):** `app/collectors/rss.py` fetches Vogue, ELLE,
  Business of Fashion, WWD, Hypebeast, Highsnobiety, The Cut, and Who
  What Wear, matches headlines against the synonym map, and stores
  observations with `source_category='editorial'`. GitHub Actions calls
  `POST /api/ingest/rss` with the `INGEST_KEY` secret on a schedule.
  One dead feed never fails the run — per-feed errors are logged.
- **YouTube / eBay (documented stubs):** `app/collectors/youtube.py`
  and `ebay.py` read API keys only from env vars (`YOUTUBE_API_KEY`,
  `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET`) and raise a clear error when
  they are absent. No real keys exist for this project.

## Config (env vars)

See `.env.example`. `DATABASE_URL` for Postgres, e.g.
`postgresql+psycopg2://user:password@localhost:5432/bias` (install
`psycopg2-binary` — commented in `requirements.txt`).

## Notes / follow-ups

- `create_all` is acceptable for v1; add Alembic migrations before any
  production deploy.
- The API serves the stored `trend_scores` rows (computed at seed /
  ingest time). The detail endpoint computes weekly volumes and the
  per-source breakdown live from the stored observations.
- RSS sentiment is 0.0 (neutral) until a classifier is added.
