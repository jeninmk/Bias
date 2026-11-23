/**
 * Lyst Index collector (STUB).
 *
 * What it would fetch: the quarterly Lyst Index hottest brands and
 * products, plus Lyst search-term movement. The Lyst Index is a
 * quarterly, data-backed ranking of what the world is actually
 * searching for and buying; it is the best single "what is hot right
 * now" list in fashion.
 *
 * Access: Lyst publishes the Index as a public quarterly report (web
 * page). No API. Manual entry each quarter: log the top products and
 * brands and their attributes.
 *
 * TODO: implement a quarterly manual-entry form; map Index rank to
 * volume (rank 1 = highest volume in the quarter).
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const lystCollector: Collector = {
  id: 'lyst',
  name: 'Lyst Index',
  category: 'lyst',
  access: 'Public quarterly report. Manual entry each quarter.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until the quarterly entry flow exists.
    return [];
  },
};
