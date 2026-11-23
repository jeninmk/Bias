import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// adapter-static: outputs a static site to build/ for Cloudflare
		// Pages (see docs/deploy.md). Pages are not prerendered (see
		// src/routes/+layout.ts): they load live data from the FastAPI
		// backend in the browser, and unmatched routes fall back to the
		// SPA shell (200.html) so /trends/[slug] works as a static site.
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '200.html',
			precompress: false,
			strict: false
		})
	}
};

export default config;
