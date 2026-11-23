/**
 * Seed data generator.
 *
 * Produces src/data/seed-observations.json: realistic curated
 * observations for 12 trend candidates across 8 weekly windows
 * (weeks starting 2026-09-28 through 2026-11-16), from at least 6
 * source categories per trend, with volumes, sentiment, and resale
 * price data for the item trends.
 *
 * Deterministic: a seeded LCG so re-running this script reproduces
 * the same file byte-for-byte.
 *
 * Run: `node scripts/generate-seed.mjs`
 */

// --- deterministic RNG (LCG) ---------------------------------------------
let seed = 20261123;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function jitter(amount) {
  return 1 + (rand() * 2 - 1) * amount;
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// --- weeks (Mondays) -------------------------------------------------------
const WEEKS = [
  '2026-09-28',
  '2026-10-05',
  '2026-10-12',
  '2026-10-19',
  '2026-10-26',
  '2026-11-02',
  '2026-11-09',
  '2026-11-16',
];

// --- source pool: category -> named sources --------------------------------
const SOURCES = {
  tiktok: ['TikTok #fashiontok', 'TikTok For You feed'],
  twitter: ['X / Twitter'],
  instagram: ['Instagram Reels', 'Instagram influencer posts'],
  pinterest: ['Pinterest Trends'],
  resale: ['Depop search', 'ThredUp search', 'Vinted search'],
  runway: ['Vogue Runway'],
  editorial: ['Vogue', 'ELLE', "Harper's Bazaar", 'Business of Fashion'],
  'color-authority': ['Pantone', 'WGSN'],
  search: ['Google Trends'],
  retail: ['Zara new-in', 'SSENSE new-in', 'ASOS new-in'],
  lyst: ['Lyst Index'],
  celebrity: ['Street style coverage', 'Red carpet coverage'],
  reddit: ['r/femalefashionadvice'],
  music: ['Festival outfits'],
  youtube: ['YouTube trend videos'],
  'ecommerce-search': ['Lyst search terms'],
  'trend-service': ['Heuritech'],
};

// --- trend configs ----------------------------------------------------------
// multipliers: weekly volume shape over the 8 weeks (1.0 = base volume).
// variants: raw terms emitted per observation (tests the synonym map).
const TRENDS = [
  {
    canonical: 'oxblood',
    type: 'color',
    base: 420,
    multipliers: [0.5, 0.7, 0.9, 1.1, 1.4, 1.7, 2.0, 2.2],
    sentiment: 0.62,
    variants: ['oxblood', 'burgundy', 'cherry red', 'wine'],
    categories: ['tiktok', 'instagram', 'pinterest', 'runway', 'editorial', 'retail', 'resale', 'search'],
    resale: { retail: 180, resaleMin: 140, resaleMax: 240, sellThrough: 0.78 },
  },
  {
    canonical: 'leopard print',
    type: 'pattern',
    base: 900,
    multipliers: [1.0, 1.1, 1.2, 1.25, 1.2, 1.15, 1.1, 1.0],
    sentiment: 0.55,
    variants: ['leopard print', 'leopard'],
    categories: ['tiktok', 'instagram', 'pinterest', 'runway', 'editorial', 'retail', 'resale', 'search', 'celebrity'],
    resale: { retail: 150, resaleMin: 110, resaleMax: 190, sellThrough: 0.71 },
  },
  {
    canonical: 'sheer',
    type: 'fabric',
    base: 300,
    multipliers: [0.4, 0.55, 0.75, 1.0, 1.3, 1.6, 1.9, 2.1],
    sentiment: 0.58,
    variants: ['sheer', 'sheer fabric', 'mesh'],
    categories: ['tiktok', 'instagram', 'runway', 'editorial', 'pinterest', 'celebrity', 'search'],
  },
  {
    canonical: 'oversized blazer',
    type: 'silhouette',
    base: 700,
    multipliers: [1.2, 1.25, 1.2, 1.1, 1.0, 0.9, 0.8, 0.72],
    sentiment: 0.48,
    variants: ['oversized blazer', 'boxy blazer'],
    categories: ['tiktok', 'instagram', 'pinterest', 'editorial', 'retail', 'resale', 'search'],
    resale: { retail: 220, resaleMin: 150, resaleMax: 210, sellThrough: 0.6 },
  },
  {
    canonical: 'ballet flats',
    type: 'item',
    base: 600,
    multipliers: [1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.38],
    sentiment: 0.42,
    variants: ['ballet flats', 'ballerina flats'],
    categories: ['tiktok', 'instagram', 'pinterest', 'retail', 'resale', 'search', 'reddit'],
    resale: { retail: 120, resaleMin: 70, resaleMax: 130, sellThrough: 0.52 },
  },
  {
    canonical: 'plaid',
    type: 'pattern',
    base: 150,
    multipliers: [0.3, 0.45, 0.7, 1.0, 1.4, 1.8, 2.2, 2.5],
    sentiment: 0.6,
    variants: ['plaid', 'tartan'],
    categories: ['tiktok', 'pinterest', 'runway', 'editorial', 'retail', 'search', 'instagram'],
  },
  {
    canonical: 'moto jacket',
    type: 'item',
    base: 350,
    multipliers: [0.5, 0.65, 0.85, 1.1, 1.35, 1.6, 1.8, 1.95],
    sentiment: 0.64,
    variants: ['moto jacket', 'biker jacket'],
    categories: ['tiktok', 'instagram', 'pinterest', 'retail', 'resale', 'search', 'celebrity'],
    resale: { retail: 280, resaleMin: 200, resaleMax: 340, sellThrough: 0.74 },
  },
  {
    canonical: 'polka dots',
    type: 'pattern',
    base: 120,
    multipliers: [0.35, 0.5, 0.7, 0.95, 1.2, 1.5, 1.75, 2.3],
    sentiment: 0.57,
    variants: ['polka dots', 'polka dot'],
    categories: ['tiktok', 'pinterest', 'runway', 'editorial', 'instagram'],
  },
  {
    canonical: 'barrel jeans',
    type: 'item',
    base: 200,
    multipliers: [0.4, 0.6, 0.85, 1.1, 1.4, 1.65, 1.85, 2.0],
    sentiment: 0.59,
    variants: ['barrel jeans', 'barrel-leg jeans'],
    categories: ['tiktok', 'instagram', 'pinterest', 'retail', 'resale', 'search', 'reddit'],
    resale: { retail: 140, resaleMin: 95, resaleMax: 175, sellThrough: 0.69 },
  },
  {
    canonical: 'eclectic maximalist',
    type: 'aesthetic',
    base: 180,
    multipliers: [0.5, 0.65, 0.8, 1.0, 1.25, 1.5, 1.7, 1.85],
    sentiment: 0.66,
    variants: ['eclectic maximalist', 'maximalist'],
    categories: ['tiktok', 'instagram', 'pinterest', 'editorial', 'youtube', 'search', 'reddit'],
  },
  {
    canonical: 'chocolate brown',
    type: 'color',
    base: 500,
    multipliers: [0.8, 0.9, 1.0, 1.1, 1.15, 1.2, 1.15, 1.1],
    sentiment: 0.61,
    variants: ['chocolate brown', 'cocoa', 'mocha'],
    categories: ['tiktok', 'instagram', 'pinterest', 'runway', 'editorial', 'retail', 'search', 'resale'],
    resale: { retail: 160, resaleMin: 120, resaleMax: 200, sellThrough: 0.66 },
  },
  {
    canonical: 'butter yellow',
    type: 'color',
    base: 250,
    multipliers: [1.0, 0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.34],
    sentiment: 0.4,
    variants: ['butter yellow', 'pale yellow'],
    categories: ['tiktok', 'instagram', 'pinterest', 'editorial', 'retail', 'search'],
  },
];

// --- generation -------------------------------------------------------------
const observations = [];
let id = 1;

for (const trend of TRENDS) {
  for (let w = 0; w < WEEKS.length; w++) {
    const weekMonday = WEEKS[w];
    // Wednesday of the week, noon UTC.
    const ts = new Date(`${weekMonday}T12:00:00Z`);
    ts.setUTCDate(ts.getUTCDate() + 2);
    const timestamp = ts.toISOString();

    const weeklyTotal = Math.round(trend.base * trend.multipliers[w] * jitter(0.08));

    // 3-6 source categories this week, shuffled deterministically.
    const shuffled = [...trend.categories];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const chosen = shuffled.slice(0, 3 + Math.floor(rand() * 4));

    // Split the weekly total across the chosen sources.
    const weights = chosen.map(() => 0.5 + rand());
    const weightSum = weights.reduce((a, b) => a + b, 0);

    chosen.forEach((category, idx) => {
      const volume = Math.max(
        5,
        Math.round((weeklyTotal * weights[idx]) / weightSum),
      );
      const obs = {
        id: `obs-${String(id).padStart(4, '0')}`,
        attribute: pick(trend.variants),
        attributeType: trend.type,
        canonicalAttribute: trend.canonical,
        source: pick(SOURCES[category]),
        sourceCategory: category,
        timestamp,
        volume,
        sentiment: Math.round(
          clamp(trend.sentiment + (rand() * 2 - 1) * 0.18, -1, 1) * 100,
        ) / 100,
      };

      // Resale price evidence on resale-category observations.
      if (category === 'resale' && trend.resale) {
        const r = trend.resale;
        obs.price = {
          avgResalePrice: Math.round(
            r.resaleMin + rand() * (r.resaleMax - r.resaleMin),
          ),
          retailPrice: r.retail,
          soldCount: Math.round(volume * 0.4),
          sellThroughRate:
            Math.round(
              clamp(r.sellThrough + (rand() * 2 - 1) * 0.08, 0, 1) * 100,
            ) / 100,
        };
      }

      observations.push(obs);
      id += 1;
    });
  }
}

const fs = await import('node:fs');
const path = await import('node:path');
const outPath = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
  'src',
  'data',
  'seed-observations.json',
);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(observations, null, 2) + '\n');

const byTrend = {};
for (const o of observations) {
  byTrend[o.canonicalAttribute] = (byTrend[o.canonicalAttribute] || 0) + 1;
}
console.log(`Wrote ${observations.length} observations to ${outPath}`);
for (const [trend, count] of Object.entries(byTrend)) {
  console.log(`  ${trend}: ${count}`);
}
