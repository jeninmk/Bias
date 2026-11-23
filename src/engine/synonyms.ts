/**
 * Synonym map: collapses raw terms from different sources into one
 * canonical attribute family, so "burgundy" on TikTok, "cherry red" on
 * Depop, and "oxblood" on the runway all count as the same trend.
 *
 * Keys are canonical attribute names. Values are the raw variants that
 * map to that canonical name (matching is case-insensitive, exact match
 * after trimming). Anything not listed here normalizes to its own
 * lowercased, trimmed form.
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  // Colors
  oxblood: [
    'oxblood',
    'burgundy',
    'bordeaux',
    'wine',
    'cherry red',
    'deep red',
    'dark red',
    'merlot',
    'oxblood red',
  ],
  'chocolate brown': [
    'chocolate brown',
    'chocolate',
    'cocoa',
    'espresso brown',
    'dark brown',
    'mocha',
    'mocha mousse',
  ],
  'butter yellow': [
    'butter yellow',
    'pale yellow',
    'soft yellow',
    'pastel yellow',
    'lemon yellow',
  ],
  navy: ['navy', 'navy blue', 'midnight blue', 'deep navy'],
  'forest green': ['forest green', 'dark green', 'hunter green'],

  // Patterns
  'leopard print': [
    'leopard print',
    'leopard',
    'animal print leopard',
    'leopard-print',
  ],
  plaid: ['plaid', 'tartan', 'checkered plaid', 'buffalo plaid'],
  'polka dots': ['polka dots', 'polka dot', 'spot print', 'dotted print'],
  'zebra print': ['zebra print', 'zebra', 'animal print zebra'],
  gingham: ['gingham', 'gingham check', 'vichy'],
  stripes: ['stripes', 'striped', 'breton stripes'],

  // Fabrics
  sheer: ['sheer', 'sheer fabric', 'sheer fabrics', 'transparent', 'mesh', 'organza'],
  lace: ['lace', 'lace fabric'],
  denim: ['denim', 'jean fabric'],

  // Silhouettes and items
  'oversized blazer': [
    'oversized blazer',
    'boxy blazer',
    'oversized suit jacket',
    'slouchy blazer',
  ],
  'ballet flats': ['ballet flats', 'ballet flat', 'ballerina flats', 'ballet shoes'],
  'moto jacket': [
    'moto jacket',
    'motorcycle jacket',
    'biker jacket',
    'moto jackets',
  ],
  'barrel jeans': [
    'barrel jeans',
    'barrel-leg jeans',
    'barrel leg jeans',
    'balloon jeans',
  ],
  'pencil skirt': ['pencil skirt', 'pencil skirts'],
  'maxi skirt': ['maxi skirt', 'long skirt'],

  // Aesthetics
  'eclectic maximalist': [
    'eclectic maximalist',
    'maximalist',
    'curated clutter',
    'eclectic maximalism',
  ],
  'quiet luxury': ['quiet luxury', 'stealth wealth', 'old money'],
  'office siren': ['office siren', 'corporate siren'],
  balletcore: ['balletcore', 'ballerina core'],
  'coastal grandmother': ['coastal grandmother', 'coastal grandma'],
};
