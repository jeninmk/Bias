/**
 * Core types for the fashion trend forecasting engine.
 *
 * A trend candidate is ONE attribute: a color, pattern, silhouette, item,
 * fabric, or aesthetic. Every signal the engine computes is derived from
 * observations of that attribute across many sources.
 */

/** The kind of attribute a trend candidate describes. */
export type AttributeType =
  | 'color'
  | 'pattern'
  | 'silhouette'
  | 'item'
  | 'fabric'
  | 'aesthetic';

/**
 * The 17 source categories in the collector catalog.
 * `breadth` (how many of these observe a trend) is the strongest signal
 * in the scoring formula, because cross-source confirmation is what
 * separates a real trend from a single-platform spike.
 */
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

/** Optional price evidence, mostly from resale sources. */
export interface PriceData {
  /** Average resale/sold price observed (USD). */
  avgResalePrice?: number;
  /** Original retail price for the same item (USD). */
  retailPrice?: number;
  /** Number of sold listings observed in this window. */
  soldCount?: number;
  /** Share of listed items that sold (0-1). */
  sellThroughRate?: number;
}

/**
 * One recorded sighting of an attribute from one source.
 * `attribute` is the raw term as it appeared (e.g. "burgundy");
 * `canonicalAttribute` is the normalized family it belongs to (e.g. "oxblood").
 */
export interface Observation {
  id: string;
  attribute: string;
  attributeType: AttributeType;
  canonicalAttribute: string;
  /** Human-readable source name, e.g. "TikTok #fashiontok" or "Vogue Runway". */
  source: string;
  sourceCategory: SourceCategory;
  /** ISO 8601 timestamp of the observation window. */
  timestamp: string;
  /** Mentions, searches, saves, listing counts, or look counts. */
  volume: number;
  /** Sentiment of the mention, -1 (negative) to 1 (positive). */
  sentiment: number;
  price?: PriceData;
}

/** The six normalized (0-100) scoring components plus the final score. */
export interface TrendScore {
  /** Final Trend Score, 0-100. */
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
  /** Confidence in the score, 0-100, from observation count and source diversity. */
  confidence: number;
}

/** Where a trend sits in its lifecycle. */
export type LifecycleStage =
  | 'emerging'
  | 'rising'
  | 'peak'
  | 'declining'
  | 'dead';

/** Forecast of when the trend will peak. */
export interface Forecast {
  /** Weeks from now until the projected peak (0 = already peaked). */
  weeksToPeak: number;
  /** Start of the projected peak window, in weeks from now. */
  peakWindowStartWeeks: number;
  /** End of the projected peak window, in weeks from now. */
  peakWindowEndWeeks: number;
  /** Trend Score the trend is projected to reach at its peak, 0-100. */
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
  /** Relative volume vs the highest-volume trend in the dataset (0-1). */
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
