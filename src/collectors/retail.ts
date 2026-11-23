/**
 * Retail new-in collector (STUB).
 *
 * What it would fetch: new-arrival attributes and sell-out speed at
 * Zara, H&M, ASOS, SSENSE, Net-a-Porter, and Shopbop. Retail is the
 * commercial confirmation: when fast fashion and luxury both push the
 * same color in the same week, the trend has institutional backing.
 * Sell-out speed (gone in days vs still stocked in weeks) is a strong
 * demand proxy.
 *
 * Access: no public APIs; product pages are public but scraping is
 * against most retailers' terms. Manual entry in v1: log weekly
 * new-in attributes and whether key pieces sold out.
 *
 * TODO: keep manual; optionally add an RSS/affiliate-feed reader where
 * a retailer offers one. Map new-in counts to volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const retailCollector: Collector = {
  id: 'retail',
  name: 'Retail new-in (Zara, H&M, ASOS, SSENSE, Net-a-Porter, Shopbop)',
  category: 'retail',
  access: 'No public API; scraping is against ToS. Manual entry in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until a feed reader exists.
    return [];
  },
};
