/**
 * TikTok collector (STUB).
 *
 * What it would fetch: trending hashtags (#fashiontok, #ootd), video
 * captions and comments mentioning an attribute, and engagement velocity
 * (views/likes growth week over week) for trend keywords, colors, and
 * patterns.
 *
 * Access: TikTok Research API (academic/research application, gated) or
 * the TikTok Content Posting / Display API (commercial, approval
 * required). The public web feed is not a stable API. Until access is
 * granted, log trends manually into the seed dataset.
 *
 * TODO: implement with the TikTok Research API once credentials exist;
 * map hashtag + caption keyword hits to observations with volume =
 * view count and sentiment from a comment sample.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const tiktokCollector: Collector = {
  id: 'tiktok',
  name: 'TikTok',
  category: 'tiktok',
  access: 'TikTok Research API (gated application). No credentials in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until API access is wired up.
    return [];
  },
};
