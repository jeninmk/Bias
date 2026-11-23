# Bias — Frontend

SvelteKit (Svelte 5, TypeScript, Tailwind CSS) frontend for Bias, the fashion
trend forecasting site. A thin display layer: all trend data comes from the
FastAPI backend. Ported from the v1 Next.js app (`src/app/`, `src/lib/trends.ts`).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

The backend is expected at `http://localhost:8000` by default. Point at a
different backend with the public env var:

```bash
PUBLIC_API_URL=https://api.example.com npm run dev
```

## Build / preview

```bash
npm run build      # builds with no backend running — pages fetch at request time
npm run preview    # serves the static build from build/
npm run check      # svelte-check
```

## How it works

- Routes: `/` (ranking + fastest risers), `/trends/[slug]` (detail: score
  breakdown, forecast, weekly volume bars, per-source breakdown),
  `/colors` (palette + Pantone Color of the Year 2025, Mocha Mousse),
  `/methodology` (scoring formula, signals, lifecycle, limitations).
- Data layer: `src/lib/api.ts` fetches `GET /api/trends`,
  `GET /api/trends/{slug}`, `GET /api/colors`, `GET /api/methodology`
  from `PUBLIC_API_URL` (default `http://localhost:8000`). Responses are
  typed to mirror the v1 `ScoredTrend` shape (`src/lib/types.ts`).
- If the backend is not reachable, pages render a clear
  "Backend not reachable — start the FastAPI server" state instead of
  failing, and `npm run build` still succeeds. The methodology page is
  static content ported from v1, so it renders even with the backend down.
- No API keys anywhere in the frontend. The favicon is an inline SVG data
  URI in `src/app.html` (no binary files).
