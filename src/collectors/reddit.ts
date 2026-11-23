/**
 * Reddit collector (STUB).
 *
 * What it would fetch: discussion volume and sentiment in
 * r/femalefashionadvice, r/streetwear, and r/fashion. Reddit is the
 * enthusiast signal: long threads debating whether a trend is "over"
 * usually arrive right at the peak, and early adoption threads in
 * niche subs precede mainstream pickup.
 *
 * Access: Reddit API (free tier exists but is rate-limited; pushshift
 * is gone). RSS feeds exist per subreddit for new posts. Manual entry
 * in v1: log weekly thread counts for attribute keywords.
 *
 * TODO: implement with the Reddit API free tier or subreddit RSS;
 * map thread/post counts to volume and comment sentiment to sentiment.
 */
import type { Observation } from '../engine/types';
import type { Collector } from './index';

export const redditCollector: Collector = {
  id: 'reddit',
  name: 'Reddit (r/femalefashionadvice, r/streetwear, r/fashion)',
  category: 'reddit',
  access: 'Reddit API free tier (rate-limited) or subreddit RSS. Manual entry in v1.',
  async fetchObservations(): Promise<Observation[]> {
    // Stub: returns no observations until API/RSS access is wired up.
    return [];
  },
};
