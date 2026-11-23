"""
Normalization: collapse raw attribute terms to canonical families.

Every observation keeps BOTH its raw term (``attribute``, as it appeared
on the source) and its canonical family (``canonical_attribute``). The
engine scores canonical families; the detail pages can still show
which raw terms fed into a trend.

Port of ``src/engine/normalize.ts``.
"""

from __future__ import annotations

from .synonyms import SYNONYM_MAP


def normalize_attribute(raw: str) -> str:
    """Map a raw term to its canonical attribute family."""
    cleaned = raw.strip().lower()
    for canonical, variants in SYNONYM_MAP.items():
        if any(v.lower() == cleaned for v in variants):
            return canonical
    return cleaned


def variants_for(canonical: str) -> list[str]:
    """All raw variants known for a canonical attribute (itself included)."""
    variants = SYNONYM_MAP.get(canonical)
    return list(variants) if variants else [canonical]
