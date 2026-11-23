"""Shared fixtures for Bias backend tests.

API tests run against a real SQLite file in tmp_path (seeded or empty),
with the app's ``get_db`` dependency overridden to use it.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base, get_db
from app.main import app
from app.seed import seed_db


def build_client(tmp_path, seeded: bool) -> TestClient:
    db_path = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_path}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    if seeded:
        db = TestingSession()
        try:
            seed_db(db)
        finally:
            db.close()

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app, raise_server_exceptions=False)
    return client


@pytest.fixture()
def seeded_client(tmp_path):
    client = build_client(tmp_path, seeded=True)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture()
def empty_client(tmp_path):
    client = build_client(tmp_path, seeded=False)
    yield client
    app.dependency_overrides.clear()
