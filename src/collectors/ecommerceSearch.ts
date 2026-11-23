/**
 * E-commerce search collector (STUB).
 *
 * What it would fetch: search terms on ShopStyle and Lyst. These are
 * shopping-intent searches ("oxblood bag", "leopard coat"), so they
 * sit one step closer to purchase than Google Trends: people are
 * looking to buy, not just to look.
 *
 * Access: no public API for either site's search terms. Manual entry
 * in v1: log weekly top search terms from Lyst's published search
 * data and ShopStyle trend pages.
 *
 * TODO: keep manual; watch for any affiliate or partner feed that
 * exposes search volume. Map search counts to volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const ecommerceSearchCollector: Collector = {
  id: 'ecommerce-search',
  name: 'E-commerce search (ShopStyle, Lyst search terms)',
  category: 'ecommerce-search',
  access: 'No public API. Manual entry in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until a feed exists.
    return [];
  },
};
