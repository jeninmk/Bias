/**
 * Resale demand collector (STUB).
 *
 * What it would fetch: search keywords, listing counts, sold prices,
 * and sell-through velocity on Depop, ThredUp, Vinted, Poshmark, eBay,
 * and Grailed. Resale is the demand signal the general public actually
 * puts money behind: if "oxblood" searches and sold prices spike on
 * Depop, people are buying the trend, not just posting about it.
 *
 * Access: there is no official public API for Depop, ThredUp, or
 * Vinted, and all of them block scraping (bot detection, ToS). eBay
 * has the Browse API (approved app) and is the one automatable resale
 * source. Until then, log weekly search terms, listing counts, and
 * sold prices manually from the sites' search pages.
 *
 * TODO: implement eBay Browse API first (sold listings + search volume);
 * keep Depop/ThredUp/Vinted/Poshmark/Grailed as manual-entry rows.
 * Map sold price vs retail to PriceData and sell-through to volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const resaleCollector: Collector = {
  id: 'resale',
  name: 'Resale demand (Depop, ThredUp, Vinted, Poshmark, eBay, Grailed)',
  category: 'resale',
  access: 'eBay Browse API (approved app); Depop/ThredUp/Vinted block scraping, manual entry only. No credentials in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until API access is wired up.
    return [];
  },
};
