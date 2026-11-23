/**
 * Instagram collector (STUB).
 *
 * What it would fetch: Reels and hashtag volume, influencer posts
 * featuring an attribute, and save/share signals where available.
 * Instagram is where a trend goes from niche to mainstream: when the
 * same color shows up across unrelated influencers' grids, breadth
 * jumps.
 *
 * Access: Instagram Graph API (requires a Business/Creator account and
 * an approved app; hashtag search is limited). No stable public API.
 * Until access is granted, log influencer sightings manually.
 *
 * TODO: implement with the Instagram Graph API hashtag search once an
 * app is approved; map hashtag media counts to volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const instagramCollector: Collector = {
  id: 'instagram',
  name: 'Instagram',
  category: 'instagram',
  access: 'Instagram Graph API (approved app required). No credentials in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until API access is wired up.
    return [];
  },
};
