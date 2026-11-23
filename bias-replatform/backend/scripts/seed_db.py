"""Seed the Bias database from the v1 seed dataset.

Run from ``backend/``:

    python scripts/seed_db.py

This loads ``../src/data/seed-observations.json`` (433 observations,
12 trends) into the DB and computes/stores trend scores. Idempotent:
re-running replaces the seed observations (matched by id) and
recomputes all scores.

Equivalent: ``python -m app.seed`` from ``backend/``.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow running as a plain script from backend/ (adds backend/ to sys.path).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.seed import main  # noqa: E402

if __name__ == "__main__":
    main()
