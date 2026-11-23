/** Shared labels, styles and helpers ported from the v1 app
 * (`src/engine/lifecycle.ts`, `src/lib/trends.ts`). */
import type { LifecycleStage, SourceCategory } from './types';

export const STAGE_LABELS: Record<LifecycleStage, string> = {
	emerging: 'Emerging',
	rising: 'Rising',
	peak: 'Peak',
	declining: 'Declining',
	dead: 'Dead'
};

export const STAGE_STYLES: Record<LifecycleStage, string> = {
	emerging: 'bg-amber-100 text-amber-800 ring-amber-300',
	rising: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
	peak: 'bg-rose-100 text-rose-800 ring-rose-300',
	declining: 'bg-slate-200 text-slate-700 ring-slate-300',
	dead: 'bg-zinc-200 text-zinc-500 ring-zinc-300'
};

export const CATEGORY_LABELS: Record<SourceCategory, string> = {
	tiktok: 'TikTok',
	twitter: 'X / Twitter',
	instagram: 'Instagram',
	pinterest: 'Pinterest',
	resale: 'Resale demand',
	runway: 'Runway',
	editorial: 'Editorial',
	'color-authority': 'Color authority',
	search: 'Search',
	retail: 'Retail new-in',
	lyst: 'Lyst Index',
	celebrity: 'Celebrity / street style',
	reddit: 'Reddit',
	music: 'Music / festivals',
	youtube: 'YouTube',
	'ecommerce-search': 'E-commerce search',
	'trend-service': 'Trend services'
};

/** Hex swatches for the color trends in the v1 seed data. */
export const COLOR_HEX: Record<string, string> = {
	oxblood: '#4A0E0E',
	'chocolate brown': '#3B2314',
	'butter yellow': '#F2D492'
};

/** Pantone Color of the Year 2025, shown on the colors page for context. */
export const PANTONE_COTY_2025 = {
	name: 'Mocha Mousse',
	hex: '#A47864',
	year: 2025
};

/** URL-safe slug for a canonical attribute name. */
export function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

export function formatPercent(rate: number): string {
	const pct = Math.round(rate * 100);
	return `${pct > 0 ? '+' : ''}${pct}%`;
}
