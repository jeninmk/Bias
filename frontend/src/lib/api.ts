/**
 * Data layer: thin fetch wrappers over the FastAPI backend.
 *
 * Base URL comes from the public env var `PUBLIC_API_URL`
 * (`$env/dynamic/public`), defaulting to `http://localhost:8000` for
 * local dev. No API keys are used anywhere in the frontend.
 *
 * Every helper returns `{ data, error }` and never throws, so a
 * `+page.ts` load function can render a "backend not reachable" state
 * instead of failing — and `npm run build` succeeds with no backend
 * running (no page is prerendered; loads run at request time).
 *
 * The FastAPI backend speaks snake_case (`canonical_attribute`,
 * `trend_score`, `source_categories`, ...); the types in `./types`
 * are the camelCase names ported from the v1 app. Every JSON response
 * is converted with `toCamel` below, so the pages never see the
 * backend's wire format.
 */
import { env } from '$env/dynamic/public';
import type { ScoredTrend, SourceBreakdown, TrendDetail, WeeklyVolume } from './types';

export const API_BASE = env.PUBLIC_API_URL ?? 'http://localhost:8000';

export type ApiResult<T> = { data: T | null; error: string | null };

/** Recursively convert snake_case keys to camelCase. The backend's
 * Pydantic schemas are snake_case by design; the frontend's types
 * are camelCase. Without this, every field read (`trendScore`,
 * `sourceCategories`, `canonicalAttribute`, ...) comes back
 * `undefined` and the pages crash on the real data. */
function toCamel(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(toCamel);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
				key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
				toCamel(entry)
			])
		);
	}
	return value;
}

async function getJson<T>(path: string): Promise<ApiResult<T>> {
	try {
		const res = await fetch(`${API_BASE}${path}`, {
			headers: { Accept: 'application/json' }
		});
		if (!res.ok) {
			return { data: null, error: `Backend returned ${res.status} for ${path}` };
		}
		return { data: toCamel(await res.json()) as T, error: null };
	} catch {
		return { data: null, error: `Backend not reachable at ${API_BASE}` };
	}
}

/** Accept either a bare array or an envelope like `{ trends: [...] }`. */
function asArray<T>(value: unknown, key: string): T[] {
	if (Array.isArray(value)) return value as T[];
	if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>)[key])) {
		return (value as Record<string, unknown>)[key] as T[];
	}
	return [];
}

function byScoreDesc(a: ScoredTrend, b: ScoredTrend): number {
	return b.score.trendScore - a.score.trendScore;
}

/** GET /api/trends — ranked list (highest Trend Score first). */
export async function fetchTrends(): Promise<ApiResult<ScoredTrend[]>> {
	const { data, error } = await getJson<unknown>('/api/trends');
	if (error || !data) return { data: null, error };
	const trends = asArray<ScoredTrend>(data, 'trends');
	return { data: [...trends].sort(byScoreDesc), error: null };
}

/**
 * GET /api/trends/{slug} — one trend's detail. Accepts a flat
 * ScoredTrend, or an object wrapping it with `breakdown`,
 * `weekly` / `weeklyVolumes`, and `rawTerms` alongside it. The
 * backend names these `source_breakdown` / `weekly_volumes`;
 * `toCamel` in `getJson` has already converted them by the time
 * they arrive here.
 */
export async function fetchTrendDetail(slug: string): Promise<ApiResult<TrendDetail>> {
	const { data, error } = await getJson<unknown>(`/api/trends/${slug}`);
	if (error || !data) return { data: null, error };
	const obj = data as Record<string, unknown>;
	const trend = (obj.trend ?? obj) as ScoredTrend;
	if (!trend || typeof trend.canonicalAttribute !== 'string') {
		return { data: null, error: `Backend returned an unexpected shape for /api/trends/${slug}` };
	}
	return {
		data: {
			trend,
			breakdown: asArray<SourceBreakdown>(obj.breakdown ?? obj.sourceBreakdown, 'breakdown'),
			weekly: asArray<WeeklyVolume>(obj.weekly ?? obj.weeklyVolumes, 'weekly'),
			rawTerms: asArray<string>(obj.rawTerms, 'rawTerms')
		},
		error: null
	};
}

/**
 * GET /api/colors — color trends. Accepts a bare array of trends, an
 * envelope `{ colors: [...] }`, or a `{ trends: [...] }` list (filtered
 * to colors). Falls back to filtering GET /api/trends when the colors
 * endpoint is missing — and also when it answers with its minimal
 * shape, which has no `sourceCategories` / `forecast` / `velocityRate`
 * for the colors page to render.
 */
export async function fetchColors(): Promise<ApiResult<ScoredTrend[]>> {
	const { data, error } = await getJson<unknown>('/api/colors');
	if (!error && data) {
		const colors = asArray<ScoredTrend>(data, 'colors');
		const list = (colors.length ? colors : asArray<ScoredTrend>(data, 'trends')).filter(
			(t) => t.attributeType === 'color'
		);
		// If the endpoint returned color trends without an attributeType
		// set, keep them as-is rather than filtering everything away.
		const kept = list.length ? list : colors;
		if (kept.length && kept[0].sourceCategories === undefined) {
			// Minimal /api/colors shape: use the full trends list instead.
			const trends = await fetchTrends();
			if (trends.error || !trends.data) return { data: null, error: trends.error };
			return { data: trends.data.filter((t) => t.attributeType === 'color'), error: null };
		}
		return { data: [...kept].sort(byScoreDesc), error: null };
	}
	const trends = await fetchTrends();
	if (trends.error || !trends.data) return { data: null, error: trends.error };
	return { data: trends.data.filter((t) => t.attributeType === 'color'), error: null };
}

/** GET /api/methodology — the scoring spec. The methodology page is
 * static content ported from v1, so a failure here is non-fatal: the
 * page renders its built-in copy and ignores the error. */
export async function fetchMethodology(): Promise<ApiResult<Record<string, unknown>>> {
	return getJson<Record<string, unknown>>('/api/methodology');
}
