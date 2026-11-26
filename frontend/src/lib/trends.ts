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

/** Score bands: what a Trend Score means, in the descriptive language
 * of fashion editorial. Shown on the home-page decoder and next to
 * every score. The exact recipe stays private; these are plain words
 * for the ranges, nothing more. */
export interface ScoreBand {
	min: number;
	max: number;
	label: string;
	description: string;
	style: string;
}

export const SCORE_BANDS: ScoreBand[] = [
	{
		min: 90,
		max: 100,
		label: 'Staple Piece',
		description: 'A true wardrobe essential that endures beyond a single season.',
		style: 'bg-rose-100 text-rose-900 ring-rose-300'
	},
	{
		min: 75,
		max: 89,
		label: 'Dominant',
		description: 'Leading the conversation, seen on the runway, the feed, and the street.',
		style: 'bg-amber-100 text-amber-900 ring-amber-300'
	},
	{
		min: 60,
		max: 74,
		label: 'Ascendant',
		description: 'Rising fast and gaining ground every week.',
		style: 'bg-emerald-100 text-emerald-900 ring-emerald-300'
	},
	{
		min: 45,
		max: 59,
		label: 'Emerging',
		description: 'New on the scene, small but growing quickly.',
		style: 'bg-sky-100 text-sky-900 ring-sky-300'
	},
	{
		min: 30,
		max: 44,
		label: 'Niche',
		description: 'A quiet favorite, loved by a few, not yet everywhere.',
		style: 'bg-violet-100 text-violet-900 ring-violet-300'
	},
	{
		min: 0,
		max: 29,
		label: 'Waning',
		description: 'Cooling off, its moment passing.',
		style: 'bg-stone-200 text-stone-600 ring-stone-300'
	}
];

/** The band a score falls in. */
export function bandForScore(score: number): ScoreBand {
	return (
		SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ??
		SCORE_BANDS[SCORE_BANDS.length - 1]
	);
}

/** Display names for the six scoring signals, in the same plain words
 * the decoder and methodology page use. */
export const SIGNAL_LABELS: Record<string, string> = {
	velocity: 'Momentum',
	volume: 'Volume',
	breadth: 'Breadth',
	sentiment: 'Sentiment',
	resale: 'Resale',
	authority: 'Authority'
};

/** One-line plain-words description per signal, for the decoder. */
export const SIGNAL_DESCRIPTIONS: Record<string, string> = {
	velocity: 'Is it picking up speed, week over week?',
	volume: 'How much are people talking about it and searching for it?',
	breadth: 'How many different kinds of sources are seeing it?',
	sentiment: 'Do people like it, or just argue about it?',
	resale: 'Are people paying more than retail for it secondhand?',
	authority: 'Did the runway and the editors get there first?'
};
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
