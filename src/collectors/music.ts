/**
 * Music and festival culture collector (STUB).
 *
 * What it would fetch: festival outfits (Coachella, Governors Ball,
 * Primavera) and music-video styling featuring an attribute. Festival
 * season is a trend accelerant: one viral festival look can push an
 * item from emerging to peak in a week.
 *
 * Access: no public API; coverage lives on editorial and social
 * sources. Manual entry in v1: log notable festival and video looks
 * during festival season.
 *
 * TODO: keep manual; optionally cross-reference TikTok/Instagram
 * festival hashtags. Map sightings to volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const musicCollector: Collector = {
  id: 'music',
  name: 'Music and festival culture',
  category: 'music',
  access: 'No public API. Manual entry in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until the entry flow exists.
    return [];
  },
};
