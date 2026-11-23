/**
 * Color authority collector (STUB).
 *
 * What it would fetch: Pantone Color of the Year and the Pantone
 * Fashion Color Trend Report (seasonal, per fashion week), plus WGSN
 * color forecasts. Color authorities are the strongest early signal
 * for colors specifically: a Pantone seasonal pick that also shows up
 * on runways is almost always a rising trend.
 *
 * Access: Pantone publishes its reports as public pages and PDFs;
 * WGSN is a paid subscription with no public API. Until automation
 * exists, log each report's palette manually when it is published.
 *
 * TODO: implement a manual-entry form for Pantone/WGSN palettes; a
 * color-authority observation carries high authority weight in scoring.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const colorAuthorityCollector: Collector = {
  id: 'color-authority',
  name: 'Color authority (Pantone, WGSN)',
  category: 'color-authority',
  access: 'Pantone public reports; WGSN paid subscription. Manual entry in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until the palette entry flow exists.
    return [];
  },
};
