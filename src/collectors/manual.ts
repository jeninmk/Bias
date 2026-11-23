/**
 * Manual-entry collector (LIVE in v1).
 *
 * Reads the curated seed dataset (src/data/seed-observations.json) and
 * returns it as observations. This is how data gets into the system
 * until the gated API collectors are wired up: a human reads a source
 * (a TikTok trend list, a Vogue Runway show, a Depop search page) and
 * adds a row to the seed file.
 *
 * Every observation is re-normalized on the way out, so raw terms in
 * the seed file ("burgundy", "cherry red") always land in the right
 * canonical family ("oxblood").
 */
import seedData from '../data/seed-observations.json';
import { normalizeAttribute } from '../engine/normalize';
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const manualCollector: Collector = {
  id: 'manual',
  name: 'Manual entry (seed dataset)',
  category: 'editorial',
  access: 'Curated JSON in src/data/seed-observations.json. No key needed.',
  async fetchObservations(): Promise<Observation[]> {
    const rows = seedData as unknown as Observation[];
    return rows.map((o) => ({
      ...o,
      canonicalAttribute: normalizeAttribute(o.attribute),
    }));
  },
};
