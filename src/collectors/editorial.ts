/**
 * Editorial collector (STUB).
 *
 * What it would fetch: article frequency and framing for an attribute
 * across Vogue, ELLE, Harper's Bazaar, Business of Fashion, WWD,
 * Hypebeast, Highsnobiety, The Cut, and Who What Wear. Editorial is
 * the mainstreaming signal: when the same trend is framed as "the"
 * color of the season in three magazines, it is about to peak.
 *
 * Access: most of these sites publish RSS feeds (Vogue, ELLE, BoF,
 * WWD, Hypebeast, Highsnobiety, The Cut, Who What Wear). RSS is free
 * and stable; full-text scraping is not needed, headlines + decks are
 * enough to count mentions.
 *
 * TODO: implement an RSS poller over the editorial feeds; match
 * headlines against the synonym map and count weekly mentions as volume.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const editorialCollector: Collector = {
  id: 'editorial',
  name: 'Editorial (Vogue, ELLE, Harper’s Bazaar, BoF, WWD, Hypebeast, Highsnobiety, The Cut, Who What Wear)',
  category: 'editorial',
  access: 'RSS feeds (free). No credentials needed; implement an RSS poller.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until the RSS poller is implemented.
    return [];
  },
};
