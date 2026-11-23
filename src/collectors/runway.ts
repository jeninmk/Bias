/**
 * Runway collector (STUB).
 *
 * What it would fetch: look counts per attribute from Vogue Runway
 * coverage of the four fashion weeks (New York, London, Milan, Paris)
 * plus resort and couture. Runway is the earliest authority signal:
 * a color that appears in 40% of looks across multiple houses is an
 * emerging trend months before it hits retail.
 *
 * Access: no public API. Vogue Runway pages are public web pages;
 * Tagwalk (see trend-service collector) exposes runway search data.
 * Until automation exists, log look counts manually per show.
 *
 * TODO: implement with Tagwalk data where licensed, otherwise manual
 * entry per show; map look counts to volume with authority weight.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const runwayCollector: Collector = {
  id: 'runway',
  name: 'Runway (Vogue Runway, NY/London/Milan/Paris fashion weeks)',
  category: 'runway',
  access: 'Public pages + Tagwalk (licensed). Manual entry in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until a data source is wired up.
    return [];
  },
};
