/**
 * Types mirroring the v1 engine (`src/engine/types.ts` in the Next.js app)
 * and the FastAPI backend's JSON shapes. The backend returns the same
 * fields in snake_case (`canonical_attribute`, `trend_score`, ...);
 * `src/lib/api.ts` converts every response to these camelCase names
 * with `toCamel`, and also normalizes envelope-vs-array responses.
 */

export type AttributeType =
	| 'color'
	| 'pattern'
	| 'silhouette'
	| 'item'
	| 'fabric'
	| 'aesthetic';

export type SourceCategory =
	| 'tiktok'
	| 'twitter'
	| 'instagram'
	| 'pinterest'
	| 'resale'
	| 'runway'
	| 'editorial'
	| 'color-authority'
	| 'search'
	| 'retail'
	| 'lyst'
	| 'celebrity'
	| 'reddit'
	| 'music'
	| 'youtube'
	| 'ecommerce-search'
	| 'trend-service';

export type LifecycleStage = 'emerging' | 'rising' | 'peak' | 'declining' | 'dead';

/** The six normalized (0–100) scoring components plus the final score. */
export interface TrendScore {
	/** Final Trend Score, 0–100. */
	trendScore: number;
	/** Week-over-week growth, normalized. Weight 0.30. */
	velocity: number;
	/** Total (recency-decayed) volume, normalized against the dataset max. Weight 0.20. */
	volume: number;
	/** Distinct source categories observing the trend. Weight 0.20. */
	breadth: number;
	/** Positive share of social mentions. Weight 0.10. */
	sentiment: number;
	/** Resale price premium and sell-through. Weight 0.10. */
	resale: number;
	/** Runway / editorial / color-authority weight. Weight 0.10. */
	authority: number;
	/** Confidence in the score, 0–100, from observation count and source diversity. */
	confidence: number;
}

/** Forecast of when the trend will peak. */
export interface Forecast {
	/** Weeks from now until the projected peak (0 = already peaked). */
	weeksToPeak: number;
	/** Start of the projected peak window, in weeks from now. */
	peakWindowStartWeeks: number;
	/** End of the projected peak window, in weeks from now. */
	peakWindowEndWeeks: number;
	/** Trend Score the trend is projected to reach at its peak, 0–100. */
	estimatedPeakScore: number;
}

/** A trend candidate with every computed signal attached. */
export interface ScoredTrend {
	canonicalAttribute: string;
	attributeType: AttributeType;
	score: TrendScore;
	stage: LifecycleStage;
	observationCount: number;
	/** Distinct source categories observing this trend. */
	sourceCategories: SourceCategory[];
	/** Recency-decayed total volume. */
	totalVolume: number;
	/** Raw volume in the latest complete week. */
	latestWeekVolume: number;
	/** Raw volume in the week before that. */
	previousWeekVolume: number;
	/** Week-over-week growth rate of the latest week, e.g. 0.35 = +35%. */
	velocityRate: number;
	/** Change in the growth rate vs the week before, in percentage points. */
	accelerationRate: number;
	/** Relative volume vs the highest-volume trend in the dataset (0–1). */
	relativeVolume: number;
	forecast: Forecast;
}

/** Per-source-category rollup used on the trend detail page. */
export interface SourceBreakdown {
	category: SourceCategory;
	sources: string[];
	observationCount: number;
	volume: number;
	volumeShare: number;
	avgSentiment: number;
}

/** One week of volume for the trend detail chart. */
export interface WeeklyVolume {
	/** Monday of the week, ISO date (YYYY-MM-DD). */
	week: string;
	volume: number;
}

/** Full detail payload for one trend. The backend may return the trend
 * flat (a ScoredTrend) or wrapped with its breakdowns; `api.ts`
 * normalizes both into this shape. */
export interface TrendDetail {
	trend: ScoredTrend;
	breakdown: SourceBreakdown[];
	weekly: WeeklyVolume[];
	rawTerms: string[];
}

/** One observation, as returned by the backend (used for home-page stats). */
export interface Observation {
	id: string;
	attribute: string;
	attributeType: AttributeType;
	canonicalAttribute: string;
	source: string;
	sourceCategory: SourceCategory;
	timestamp: string;
	volume: number;
	sentiment: number;
}
