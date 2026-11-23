/**
 * Dashboard data layer.
 *
 * Loads the curated seed dataset through the live manual collector,
 * runs the scoring engine once (module-level cache), and exposes the
 * ranked trends plus the breakdowns the pages need. All scores on the
 * site are computed here from real observations — nothing is hardcoded.
 */
import { scoreTrends, weekKey } from '../engine/score';
import { manualCollector } from '../collectors/manual';
import type {
  Observation,
  ScoredTrend,
  SourceBreakdown,
  WeeklyVolume,
} from '../engine/types';

/** The seed data covers the 8 weeks ending on this date. */
export const AS_OF = new Date('2026-11-23T12:00:00Z');

/** Hex swatches for the color trends in the seed data. */
export const COLOR_HEX: Record<string, string> = {
  oxblood: '#4A0E0E',
  'chocolate brown': '#3B2314',
  'butter yellow': '#F2D492',
};

/** Pantone Color of the Year 2025, shown on the colors page for context. */
export const PANTONE_COTY_2025 = {
  name: 'Mocha Mousse',
  hex: '#A47864',
  year: 2025,
};

/** URL-safe slug for a canonical attribute name. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

let observationsCache: Observation[] | null = null;
let rankedCache: ScoredTrend[] | null = null;

/** All observations (from the live manual collector). */
export async function getObservations(): Promise<Observation[]> {
  if (!observationsCache) {
    observationsCache = await manualCollector.fetchObservations();
  }
  return observationsCache;
}

/** All trends, scored and ranked by Trend Score descending. */
export async function getRankedTrends(): Promise<ScoredTrend[]> {
  if (!rankedCache) {
    const observations = await getObservations();
    rankedCache = scoreTrends(observations, AS_OF);
  }
  return rankedCache;
}

/** One trend by its URL slug, or undefined. */
export async function getTrendBySlug(
  slug: string,
): Promise<ScoredTrend | undefined> {
  const ranked = await getRankedTrends();
  return ranked.find((t) => slugify(t.canonicalAttribute) === slug);
}

/** Per-source-category rollup for one trend. */
export async function getSourceBreakdown(
  canonicalAttribute: string,
): Promise<SourceBreakdown[]> {
  const observations = await getObservations();
  const mine = observations.filter(
    (o) => o.canonicalAttribute === canonicalAttribute,
  );
  const totalVolume = mine.reduce((sum, o) => sum + o.volume, 0);

  const byCategory = new Map<
    string,
    { sources: Set<string>; count: number; volume: number; sentiment: number }
  >();
  for (const o of mine) {
    const entry = byCategory.get(o.sourceCategory) ?? {
      sources: new Set<string>(),
      count: 0,
      volume: 0,
      sentiment: 0,
    };
    entry.sources.add(o.source);
    entry.count += 1;
    entry.volume += o.volume;
    entry.sentiment += o.sentiment * o.volume;
    byCategory.set(o.sourceCategory, entry);
  }

  return [...byCategory.entries()]
    .map(([category, entry]) => ({
      category: category as SourceBreakdown['category'],
      sources: [...entry.sources],
      observationCount: entry.count,
      volume: entry.volume,
      volumeShare: totalVolume > 0 ? entry.volume / totalVolume : 0,
      avgSentiment:
        entry.volume > 0 ? entry.sentiment / entry.volume : 0,
    }))
    .sort((a, b) => b.volume - a.volume);
}

/** Weekly raw volumes for one trend, oldest first. */
export async function getWeeklyVolumes(
  canonicalAttribute: string,
): Promise<WeeklyVolume[]> {
  const observations = await getObservations();
  const mine = observations.filter(
    (o) => o.canonicalAttribute === canonicalAttribute,
  );
  const totals = new Map<string, number>();
  for (const o of mine) {
    const key = weekKey(new Date(o.timestamp));
    totals.set(key, (totals.get(key) ?? 0) + o.volume);
  }
  return [...totals.entries()]
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

/** Raw terms that fed into one trend (shows normalization at work). */
export async function getRawTerms(
  canonicalAttribute: string,
): Promise<string[]> {
  const observations = await getObservations();
  const terms = new Set<string>();
  for (const o of observations) {
    if (o.canonicalAttribute === canonicalAttribute) {
      terms.add(o.attribute);
    }
  }
  return [...terms].sort();
}
