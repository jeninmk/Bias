/**
 * Celebrity and street style collector (STUB).
 *
 * What it would fetch: red-carpet looks and street-style coverage
 * (fashion week street style, paparazzi, event dressing) featuring an
 * attribute. A color worn by three unrelated celebrities in one week
 * is a breadth signal money cannot buy.
 *
 * Access: no public API; coverage lives on editorial sites (see the
 * editorial collector) and photo agencies. Manual entry in v1: log
 * notable sightings with the wearer and event.
 *
 * TODO: keep manual; optionally cross-reference editorial RSS hits
 * tagged as street style. Map sightings to volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const celebrityCollector: Collector = {
  id: 'celebrity',
  name: 'Celebrity and street style',
  category: 'celebrity',
  access: 'No public API. Manual entry in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until the entry flow exists.
    return [];
  },
};
