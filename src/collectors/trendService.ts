/**
 * Trend services collector (STUB).
 *
 * What it would fetch: Tagwalk runway search data (which looks and
 * attributes users search for after the shows) and Heuritech
 * social-image analysis (AI-tagged attributes in millions of social
 * photos, with trend curves). These are the professional-grade
 * sources: Heuritech in particular measures what people actually
 * wear in photos, not what they say they wear.
 *
 * Access: both are paid B2B services with no free tier. Tagwalk has
 * a public-facing search product; Heuritech is enterprise-only.
 * Manual entry in v1: log Tagwalk's published trend pages when they
 * are public.
 *
 * TODO: implement once a Tagwalk or Heuritech subscription exists;
 * map their trend curves directly to weekly volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const trendServiceCollector: Collector = {
  id: 'trend-service',
  name: 'Trend services (Tagwalk, Heuritech)',
  category: 'trend-service',
  access: 'Paid B2B subscriptions (Tagwalk, Heuritech). No access in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until a subscription exists.
    return [];
  },
};
