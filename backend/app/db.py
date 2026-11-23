"""Database setup: engine, session factory, declarative base.

SQLite for local dev; Postgres via the ``DATABASE_URL`` env var.
``create_all`` is acceptable for v1; Alembic migrations are the
follow-up before any production deploy (see README.md).
"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a session, closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables (imports models so they register on Base)."""
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
