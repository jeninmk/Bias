# Bias — Deploy guide (v2)

Stack: SvelteKit frontend on Cloudflare Pages, FastAPI backend on
Render, PostgreSQL on Neon, GitHub Actions for scheduled ingestion.
All three hosts have free tiers. Do the steps in order: database
first, then backend, then frontend, then the scheduled job.

## 0. What you need

- A GitHub account with the `jeninmk/Bias` repo (already exists).
- Accounts on Neon, Render, and Cloudflare (create them yourself;
  no account is created by any agent or script here).
- No API keys are needed to deploy. YouTube and eBay keys are
  optional and added later, only in the Render dashboard.

## 1. Database — Neon (PostgreSQL)

1. At [neon.tech](https://neon.tech), create a project (free tier)
   and a database, e.g. `bias`.
2. Copy the connection string. It looks like
   `postgres://<user>:<password>@<host>/<database>?sslmode=require`.
3. Keep it somewhere safe for step 2. Never paste it into chat,
   a file, or the repo.

## 2. Backend — Render (FastAPI)

1. At [render.com](https://render.com), create a **Web Service**
   from the `jeninmk/Bias` repo, branch `main`, root directory
   `backend/`.
2. Or use the `render.yaml` blueprint in the repo root (Render →
   New → Blueprint → select the repo). It declares the free-tier
   web service with the right build and start commands.
3. Build command: `pip install -r requirements.txt`
   Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set these env vars in the Render dashboard (never in the repo):
   - `DATABASE_URL` — the Neon connection string from step 1.
   - `FRONTEND_ORIGIN` — the Cloudflare Pages URL from step 3
     (set this after the frontend exists; until then the API
     allows only local dev).
   - `INGEST_KEY` — a long random string you generate (e.g.
     `openssl rand -hex 32`). The GitHub Actions job uses the
     same value.
   - Later, when you have them: `YOUTUBE_API_KEY`,
     `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`.
5. Deploy. Note the service URL, e.g.
   `https://bias-api.onrender.com`.
6. Check `GET /health` returns `{"status": "ok"}`. Then seed the
   database once: run the seed script locally with `DATABASE_URL`
   pointed at Neon (see `backend/README.md`), or call the seed
   step from your machine. Render's free tier spins down after
   inactivity, so the first request after a while is slow — that
   is the price of free.

## 3. Frontend — Cloudflare Pages (SvelteKit)

1. At [dash.cloudflare.com](https://dash.cloudflare.com) → Workers
   & Pages → Create → Pages → connect the `jeninmk/Bias` repo.
2. Settings:
   - Framework preset: **SvelteKit**
   - Root directory: `frontend/`
   - Build command: `npm run build`
   - Build output directory: `build`
     (SvelteKit with `adapter-static` outputs to `build/`.)
   - Node version: 20
3. Set this env var in the Pages dashboard:
   - `PUBLIC_API_URL` — the Render service URL from step 2
     (e.g. `https://bias-api.onrender.com`). This is a public
     address, not a secret.
4. Deploy. Note the Pages URL, e.g. `https://bias.pages.dev`.
5. Go back to Render and set `FRONTEND_ORIGIN` to that Pages URL,
   then redeploy the backend so CORS allows the live frontend.

## 4. Scheduled ingestion — GitHub Actions

1. In the repo, go to Settings → Secrets and variables → Actions
   → New repository secret, and add:
   - `BIAS_API_URL` — the Render service URL from step 2.
   - `BIAS_INGEST_KEY` — the same random string you put in
     `INGEST_KEY` on Render.
2. `.github/workflows/ingest.yml` is already in the repo. It runs
   weekly (Sundays 06:00 UTC) and calls
   `POST /api/ingest/rss` with the secret header. You can also run
   it manually from the Actions tab (workflow_dispatch).
3. Check the Actions run log and the backend's `IngestionRun`
   rows to confirm it worked.

## 5. Verify the whole thing

1. Open the Cloudflare Pages URL. The home page should list the
   12 seeded trends ranked by score (polka dots at the top).
2. Open a trend detail page; the score breakdown and forecast
   should render.
3. `GET <render-url>/health` should return ok.
4. After the first scheduled ingestion, new editorial observations
   should appear in the database and the scores should move.

## Notes and limits

- Render free tier spins down after ~15 minutes idle; the first
  request after that takes up to a minute. Upgrade the service to
  paid to remove this.
- Cloudflare Pages free tier is generous and has no such spin-down.
- Neon free tier includes a small amount of storage and compute;
  plenty for this workload.
- If you ever want the frontend on GitHub Pages instead, SvelteKit
  can export a static site and Pages can host it — but Pages is
  static-only, so the backend would still live on Render. The
  security rules do not change: keys stay server-side.
