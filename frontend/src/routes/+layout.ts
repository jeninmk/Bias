// No page is prerendered: every route loads live data from the FastAPI
// backend in the browser at request time. This keeps `npm run build`
// independent of the backend and lets adapter-static serve the app as
// a static site (Cloudflare Pages) with the 200.html SPA fallback.
export const prerender = false;
