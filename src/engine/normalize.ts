/**
 * Normalization: collapse raw attribute terms to canonical families.
 *
 * Every observation keeps BOTH its raw term (`attribute`, as it appeared
 * on the source) and its canonical family (`canonicalAttribute`). The
 * engine scores canonical families; the detail pages can still show
 * which raw terms fed into a trend.
 */
import { SYNONYM_MAP } from './synonyms';

/** Map a raw term to its canonical attribute family. */
export function normalizeAttribute(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  for (const [canonical, variants] of Object.entries(SYNONYM_MAP)) {
    if (variants.some((v) => v.toLowerCase() === cleaned)) {
      return canonical;
    }
  }
  return cleaned;
}

/** All raw variants known for a canonical attribute (itself included). */
export function variantsFor(canonical: string): string[] {
  const variants = SYNONYM_MAP[canonical];
  return variants ? [...variants] : [canonical];
}
