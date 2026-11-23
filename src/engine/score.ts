/**
 * Scoring engine.
 *
 * Signals are computed per attribute over rolling weekly windows, then
 * combined into a Trend Score (0-100):
 *
 *   Trend Score = 0.30*velocity + 0.20*volume + 0.20*breadth
 *               + 0.10*sentiment + 0.10*resale + 0.10*authority
 *
 * Each component is normalized to 0-100 BEFORE weighting, so no single
 * signal can dominate because of raw units (mentions vs prices).
 *
 * - velocity:  week-over-week growth of the latest complete week.
 *              0% growth scores 50; +50% scores 100; -50% scores 0.
 * - volume:    recency-decayed total volume, log-normalized against the
 *              highest-volume trend in the dataset.
 * - breadth:   distinct source categories observing the trend, out of
 *              the 17 in the catalog. Cross-source confirmation is the
 *              strongest signal: a trend seen on TikTok AND the runway
 *              AND resale is far more real than a TikTok-only spike.
 * - sentiment: volume-weighted average sentiment over the last 4 weeks,
 *              mapped from [-1, 1] to [0, 100].
 * - resale:    resale price premium vs retail blended with sell-through
 *              rate. 50 (neutral) when no resale data exists.
 * - authority: share of recent volume from runway, editorial, and
 *              color-authority sources, scaled up (early signals from
 *              these sources matter more than their raw volume).
 *
 * Recency: observations decay exponentially with a 14-day half-life,
 * so last week's runway show counts more than a mention from two
 * months ago. Velocity uses RAW weekly volumes (decay would distort
 * the growth rate); volume, sentiment, and authority use decayed
 * volumes.
 *
 * Confidence (0-100) = 0.5 * observation-count score + 0.5 * source
 * diversity, so a score built on 30 observations across 9 sources is
 * trusted more than one built on 4 observations from 1 source.
 */
import type {
  Observation,
  ScoredTrend,
  SourceCategory,
  TrendScore,
} from './types';
import { classifyStage } from './lifecycle';
import { forecastPeak } from './forecast';

/** Number of source categories in the catalog. */
export const SOURCE_CATEGORY_COUNT = 17;

/** Recency half-life in days: an observation loses half its weight every 14 days. */
export const RECENCY_HALF_LIFE_DAYS = 14;

/** How many trailing weeks of raw volume feed velocity and acceleration. */
export const VELOCITY_WINDOW_WEEKS = 8;

/** How many trailing weeks count as "recent" for breadth, sentiment, authority. */
export const RECENT_WINDOW_WEEKS = 4;

/** Source categories that carry authority weight (early signals). */
export const AUTHORITY_CATEGORIES: SourceCategory[] = [
  'runway',
  'editorial',
  'color-authority',
];

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Monday (UTC) of the week containing `d`, as an ISO date string. */
export function weekStart(d: Date): Date {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // Monday = 0
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export function weekKey(d: Date): string {
  return weekStart(d).toISOString().slice(0, 10);
}

/**
 * Exponential recency weight: 1.0 for an observation from today,
 * 0.5 after one half-life (14 days), 0.25 after two, and so on.
 */
export function recencyWeight(
  timestamp: string,
  asOf: Date,
  halfLifeDays: number = RECENCY_HALF_LIFE_DAYS,
): number {
  const ageMs = asOf.getTime() - new Date(timestamp).getTime();
  const ageDays = Math.max(0, ageMs / 86_400_000);
  return Math.pow(0.5, ageDays / halfLifeDays);
}

/** Week-over-week growth rate: 0.35 means +35%. Guards against zero denominators. */
export function growthRate(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 1 : 0;
  }
  return (current - previous) / previous;
}

/** Group observations by canonical attribute. */
function groupByTrend(all: Observation[]): Map<string, Observation[]> {
  const map = new Map<string, Observation[]>();
  for (const o of all) {
    const list = map.get(o.canonicalAttribute) ?? [];
    list.push(o);
    map.set(o.canonicalAttribute, list);
  }
  return map;
}

/** Raw weekly volumes for one trend, newest first, for the last N weeks ending at the anchor week. */
function weeklyVolumes(
  observations: Observation[],
  anchorWeek: Date,
  weeks: number,
): { key: string; volume: number }[] {
  const keys: string[] = [];
  const cursor = weekStart(anchorWeek);
  for (let i = 0; i < weeks; i++) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  const totals = new Map<string, number>();
  for (const o of observations) {
    const key = weekKey(new Date(o.timestamp));
    totals.set(key, (totals.get(key) ?? 0) + o.volume);
  }
  return keys.map((key) => ({ key, volume: totals.get(key) ?? 0 }));
}

/** Score every trend in the dataset, ranked by Trend Score descending. */
export function scoreTrends(all: Observation[], asOf: Date): ScoredTrend[] {
  const byTrend = groupByTrend(all);

  // Anchor the weekly windows to the freshest week actually present in
  // the data, so the "latest complete week" is never an empty future
  // week (e.g. scoring on a Monday for a week that has not happened yet).
  let latestWeekStart = 0;
  for (const o of all) {
    const ws = weekStart(new Date(o.timestamp)).getTime();
    if (ws > latestWeekStart) {
      latestWeekStart = ws;
    }
  }
  const anchorWeek = new Date(latestWeekStart);

  // First pass: recency-decayed totals, for the volume normalization.
  const decayedTotals = new Map<string, number>();
  for (const [canonical, obs] of byTrend) {
    let total = 0;
    for (const o of obs) {
      total += o.volume * recencyWeight(o.timestamp, asOf);
    }
    decayedTotals.set(canonical, total);
  }
  const maxDecayedTotal = Math.max(1, ...decayedTotals.values());

  const scored: ScoredTrend[] = [];

  for (const [canonical, obs] of byTrend) {
    const attributeType = obs[0].attributeType;
    const weeks = weeklyVolumes(obs, anchorWeek, VELOCITY_WINDOW_WEEKS);
    const [latest, previous, previous2] = weeks;
    const latestWeekVolume = latest.volume;
    const previousWeekVolume = previous.volume;

    const velocityRate = growthRate(latestWeekVolume, previousWeekVolume);
    const previousRate = growthRate(previousWeekVolume, previous2.volume);
    const accelerationRate = velocityRate - previousRate;

    // --- velocity component: 0% growth -> 50, +50% -> 100, -50% -> 0.
    const velocityScore = clamp(50 + velocityRate * 100, 0, 100);

    // --- volume component: log-normalized decayed total vs dataset max.
    const decayedTotal = decayedTotals.get(canonical) ?? 0;
    const relativeVolume = decayedTotal / maxDecayedTotal;
    const volumeScore = clamp(
      (100 * Math.log1p(decayedTotal)) / Math.log1p(maxDecayedTotal),
      0,
      100,
    );

    // --- breadth component: distinct source categories in the recent window.
    const recentCutoff = new Date(asOf);
    recentCutoff.setUTCDate(recentCutoff.getUTCDate() - RECENT_WINDOW_WEEKS * 7);
    const recentObs = obs.filter(
      (o) => new Date(o.timestamp) >= recentCutoff,
    );
    const categories = new Set<SourceCategory>(
      recentObs.map((o) => o.sourceCategory),
    );
    const breadthScore = (categories.size / SOURCE_CATEGORY_COUNT) * 100;

    // --- sentiment component: volume-weighted average sentiment, recent window.
    let sentimentVolume = 0;
    let sentimentWeighted = 0;
    for (const o of recentObs) {
      sentimentWeighted += o.sentiment * o.volume;
      sentimentVolume += o.volume;
    }
    const avgSentiment =
      sentimentVolume > 0 ? sentimentWeighted / sentimentVolume : 0;
    const sentimentScore = clamp(((avgSentiment + 1) / 2) * 100, 0, 100);

    // --- resale component: price premium vs retail + sell-through.
    let resaleScore = 50; // neutral when no resale data exists
    const priced = obs.filter(
      (o) =>
        o.price &&
        o.price.avgResalePrice !== undefined &&
        o.price.retailPrice !== undefined &&
        o.price.retailPrice > 0,
    );
    if (priced.length > 0) {
      let premiumSum = 0;
      let sellThroughSum = 0;
      let sellThroughCount = 0;
      for (const o of priced) {
        const p = o.price!;
        premiumSum += (p.avgResalePrice! - p.retailPrice!) / p.retailPrice!;
        if (p.sellThroughRate !== undefined) {
          sellThroughSum += p.sellThroughRate;
          sellThroughCount += 1;
        }
      }
      const avgPremium = premiumSum / priced.length;
      const premiumScore = clamp(50 + avgPremium * 100, 0, 100);
      const sellThroughScore =
        sellThroughCount > 0
          ? clamp((sellThroughSum / sellThroughCount) * 100, 0, 100)
          : 50;
      resaleScore = clamp(0.6 * premiumScore + 0.4 * sellThroughScore, 0, 100);
    }

    // --- authority component: runway/editorial/color-authority share of recent volume.
    let authorityVolume = 0;
    let recentVolume = 0;
    for (const o of recentObs) {
      recentVolume += o.volume;
      if (AUTHORITY_CATEGORIES.includes(o.sourceCategory)) {
        authorityVolume += o.volume;
      }
    }
    const authorityShare =
      recentVolume > 0 ? authorityVolume / recentVolume : 0;
    // Scaled x2: authority sources are a small share of total volume but
    // carry outsized early-signal value. Capped at 100.
    const authorityScore = clamp(authorityShare * 200, 0, 100);

    // --- final weighted score.
    const trendScore = Math.round(
      0.3 * velocityScore +
        0.2 * volumeScore +
        0.2 * breadthScore +
        0.1 * sentimentScore +
        0.1 * resaleScore +
        0.1 * authorityScore,
    );

    // --- confidence: observation count and source diversity.
    const countScore = clamp((obs.length / 25) * 100, 0, 100);
    const diversityScore = (categories.size / SOURCE_CATEGORY_COUNT) * 100;
    const confidence = Math.round(0.5 * countScore + 0.5 * diversityScore);

    const score: TrendScore = {
      trendScore,
      velocity: Math.round(velocityScore),
      volume: Math.round(volumeScore),
      breadth: Math.round(breadthScore),
      sentiment: Math.round(sentimentScore),
      resale: Math.round(resaleScore),
      authority: Math.round(authorityScore),
      confidence,
    };

    const stage = classifyStage({
      relativeVolume,
      velocityRate,
      breadthCount: categories.size,
    });

    const forecast = forecastPeak({
      attributeType,
      stage,
      velocityRate,
      relativeVolume,
      trendScore,
    });

    scored.push({
      canonicalAttribute: canonical,
      attributeType,
      score,
      stage,
      observationCount: obs.length,
      sourceCategories: [...categories],
      totalVolume: Math.round(decayedTotal),
      latestWeekVolume,
      previousWeekVolume,
      velocityRate,
      accelerationRate,
      relativeVolume,
      forecast,
    });
  }

  scored.sort((a, b) => b.score.trendScore - a.score.trendScore);
  return scored;
}
