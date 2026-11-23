/**
 * Pinterest collector (STUB).
 *
 * What it would fetch: popular pins, board saves, and Pinterest Trends
 * search terms for colors, patterns, and aesthetics. Pinterest is an
 * intent signal: people save what they plan to wear or buy, so it
 * leads TikTok by weeks on slower trends like colors.
 *
 * Access: Pinterest API v5 (approved app; Trends data is limited to
 * the Pinterest Trends tool, which has no public bulk API). Until
 * access is granted, log weekly Pinterest Trends terms manually.
 *
 * TODO: implement with Pinterest API v5 pins search + manual Pinterest
 * Trends terms once an app is approved; map saves to volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const pinterestCollector: Collector = {
  id: 'pinterest',
  name: 'Pinterest',
  category: 'pinterest',
  access: 'Pinterest API v5 (approved app) + manual Pinterest Trends. No credentials in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until API access is wired up.
    return [];
  },
};
