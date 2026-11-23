/**
 * X / Twitter collector (STUB).
 *
 * What it would fetch: hashtag and keyword mention counts, quote posts,
 * and sentiment around runway looks and fashion-week moments. Best at
 * catching the immediate reaction to a show ("that oxblood look at
 * Saint Laurent") within hours.
 *
 * Access: X API v2 (Basic tier is paid and rate-limited; free tier is
 * effectively read-only for a single account). Scraping is against the
 * terms of service. Until access is granted, log runway reactions
 * manually into the seed dataset.
 *
 * TODO: implement with X API v2 recent search once a paid tier exists;
 * map mention counts to volume and run sentiment over a sample of posts.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const twitterCollector: Collector = {
  id: 'twitter',
  name: 'X / Twitter',
  category: 'twitter',
  access: 'X API v2 (paid Basic tier). No credentials in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until API access is wired up.
    return [];
  },
};
