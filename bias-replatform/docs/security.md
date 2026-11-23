# Bias — Security

Bias handles third-party API keys (YouTube, eBay) and a shared ingest
secret. The rules below are the project's security posture. They were
checked before the v2 re-platform was pushed; see the audit note at
the bottom.

## The one rule

**Secrets live only in platform environment variables. Never in code,
never in the browser bundle, never in git.**

- API keys (YouTube, eBay) live only in Render env vars.
- The ingest shared secret (`INGEST_KEY`) lives only in Render env
  vars and as a GitHub Secret (`BIAS_INGEST_KEY`).
- The database URL (`DATABASE_URL`) lives only in Render env vars.
- The frontend has no secrets at all. Its only env var is
  `PUBLIC_API_URL`, the backend's public address, which is not a
  secret.
- `.env.example` files list variable *names* only, with placeholder
  values like `change-me`. There is no `.env` file anywhere in the
  repo, and `.gitignore` covers `.env`, `*.db`, `__pycache__/`,
  `.venv/`, `node_modules/`, and `.svelte-kit/`.

## How the browser is kept away from keys

- The browser only ever talks to our FastAPI backend. It never calls
  YouTube, eBay, or any third-party API directly.
- The backend holds the keys and makes the outside calls server-side.
- CORS on the backend allows only the frontend origin
  (`FRONTEND_ORIGIN` env var; `http://localhost:5173` for local dev).
- API routes are rate limited (60 requests/minute per IP via
  slowapi) so the public endpoints cannot be hammered.
- All input is validated with Pydantic models before it touches the
  database or the engine.

## What to do if a key leaks

1. Revoke the key at the provider immediately (Google Cloud Console
   for YouTube, eBay Developer Program for eBay) and issue a new one.
2. Replace it in the Render dashboard env vars and redeploy.
3. If the key was committed to git, rewrite history or rotate and
   treat the old key as burned — deleting the file is not enough.
4. Check GitHub's secret scanning alerts on the repo.

## Dependency and repo hygiene

- Dependabot is enabled for the repo (npm + pip).
- GitHub secret scanning is on.
- No binary files are pushed through the snapshot push flow (it
  requires UTF-8 only); the frontend ships an SVG favicon, not an
  `.ico`.
- The v1 Next.js app in `src/` is legacy and unmaintained; it
  contains no secrets and makes no outside calls.

## Audit note (v2 re-platform)

Before the `replatform-svelte-fastapi` branch was pushed, the whole
tree was grepped for key-like patterns (`sk-`, `AKIA`, `password`,
`token`, `BEGIN PRIVATE KEY`) and checked for `.env` files and
non-UTF-8 files. Result: no secrets, no `.env` files, no binary
files in the push selection. The only key-adjacent strings are the
placeholder values in `.env.example` files and the variable names in
docs.
