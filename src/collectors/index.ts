/**
 * Collector interface.
 *
 * Every source in the catalog implements this same shape: a collector
 * fetches observations for any attribute it has seen. The engine does
 * not care where an observation came from, only what it says.
 *
 * In v1 only the manual collector is live (it reads the curated seed
 * dataset). The other 17 collectors are documented stubs: they declare
 * what they WOULD fetch and how to get access, and return no
 * observations until their access is wired up. See docs/sources.md.
 */
import type { Observation, SourceCategory } from '../engine/types';

export interface Collector {
  /** Stable id, e.g. "tiktok". */
  id: string;
  /** Human-readable name, e.g. "TikTok". */
  name: string;
  /** Which of the 17 source categories this collector feeds. */
  category: SourceCategory;
  /** Short note on what access this collector needs (API key, RSS, manual). */
  access: string;
  /** Fetch all observations this collector currently has. */
  fetchObservations(): Promise<Observation[]>;
}

export { manualCollector } from './manual';
export { tiktokCollector } from './tiktok';
export { twitterCollector } from './twitter';
export { instagramCollector } from './instagram';
export { pinterestCollector } from './pinterest';
export { resaleCollector } from './resale';
export { runwayCollector } from './runway';
export { editorialCollector } from './editorial';
export { colorAuthorityCollector } from './colorAuthority';
export { searchCollector } from './search';
export { retailCollector } from './retail';
export { lystCollector } from './lyst';
export { celebrityCollector } from './celebrity';
export { redditCollector } from './reddit';
export { musicCollector } from './music';
export { youtubeCollector } from './youtube';
export { ecommerceSearchCollector } from './ecommerceSearch';
export { trendServiceCollector } from './trendService';

import { manualCollector } from './manual';
import { tiktokCollector } from './tiktok';
import { twitterCollector } from './twitter';
import { instagramCollector } from './instagram';
import { pinterestCollector } from './pinterest';
import { resaleCollector } from './resale';
import { runwayCollector } from './runway';
import { editorialCollector } from './editorial';
import { colorAuthorityCollector } from './colorAuthority';
import { searchCollector } from './search';
import { retailCollector } from './retail';
import { lystCollector } from './lyst';
import { celebrityCollector } from './celebrity';
import { redditCollector } from './reddit';
import { musicCollector } from './music';
import { youtubeCollector } from './youtube';
import { ecommerceSearchCollector } from './ecommerceSearch';
import { trendServiceCollector } from './trendService';

/** All collectors in the catalog, in catalog order. */
export const ALL_COLLECTORS: Collector[] = [
  manualCollector,
  tiktokCollector,
  twitterCollector,
  instagramCollector,
  pinterestCollector,
  resaleCollector,
  runwayCollector,
  editorialCollector,
  colorAuthorityCollector,
  searchCollector,
  retailCollector,
  lystCollector,
  celebrityCollector,
  redditCollector,
  musicCollector,
  youtubeCollector,
  ecommerceSearchCollector,
  trendServiceCollector,
];

/** Collectors that actually return data right now (v1: manual only). */
export const LIVE_COLLECTORS: Collector[] = ALL_COLLECTORS.filter(
  (c) => c.id === 'manual',
);

/** Run every live collector and merge the observations. */
export async function fetchAllObservations(): Promise<Observation[]> {
  const batches = await Promise.all(
    LIVE_COLLECTORS.map((c) => c.fetchObservations()),
  );
  return batches.flat();
}
