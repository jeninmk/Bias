"""Configuration from environment variables.

No secrets are stored here. Values are read from the environment (or a
``.env`` file in local dev) at runtime. See ``.env.example``.
"""

from __future__ import annotations

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent

# SQLite for local dev; Postgres via DATABASE_URL, e.g.
# postgresql+psycopg2://user:password@localhost:5432/bias
DATABASE_URL = os.environ.get(
    "DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'bias.db'}"
)

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

# Shared secret protecting POST /api/ingest/rss. GitHub Actions calls that
# endpoint with header ``X-Ingest-Key: <INGEST_KEY>``.
INGEST_KEY = os.environ.get("INGEST_KEY", "")

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
EBAY_CLIENT_ID = os.environ.get("EBAY_CLIENT_ID", "")
EBAY_CLIENT_SECRET = os.environ.get("EBAY_CLIENT_SECRET", "")

# Rate limit for API routes, requests per minute per IP.
RATE_LIMIT_PER_MINUTE = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "60"))
