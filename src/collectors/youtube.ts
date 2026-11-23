/**
 * YouTube collector (STUB).
 *
 * What it would fetch: fashion hauls, trend roundups ("fall trends
 * 2026"), and try-on videos mentioning an attribute, with view counts
 * and like ratios. YouTube is the long-form explainer signal: when
 * creators with large audiences all make the same trend video in the
 * same month, the trend is being packaged for the mainstream.
 *
 * Access: YouTube Data API v3 (free tier, 10,000 quota units/day;
 * search is expensive at 100 units per call). Feasible for a small
 * keyword list.
 *
 * TODO: implement with YouTube Data API v3 search.list over a fixed
 * keyword list, weekly; map view counts to volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const youtubeCollector: Collector = {
  id: 'youtube',
  name: 'YouTube (hauls, trend videos)',
  category: 'youtube',
  access: 'YouTube Data API v3 (free tier, quota-limited). API key needed.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until an API key is configured.
    return [];
  },
};
