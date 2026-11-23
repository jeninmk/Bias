/**
 * Search collector (STUB).
 *
 * What it would fetch: Google Trends and Pinterest Trends interest
 * over time for attribute keywords. Search is the intent signal:
 * rising search interest precedes buying by weeks, and it is one of
 * the few signals that is quantitative, free, and comparable across
 * attributes.
 *
 * Access: Google Trends has no official API (pytrends is an unofficial
 * wrapper and breaks often); Pinterest Trends has no public bulk API.
 * Both are manual-entry in v1: record the weekly index (0-100) from
 * the Trends tools.
 *
 * TODO: implement a pytrends job with graceful failure, or keep manual
 * weekly entries; map the Trends index to volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const searchCollector: Collector = {
  id: 'search',
  name: 'Search (Google Trends, Pinterest Trends)',
  category: 'search',
  access: 'No official API; pytrends is unofficial. Manual entry in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until a Trends job is implemented.
    return [];
  },
};
