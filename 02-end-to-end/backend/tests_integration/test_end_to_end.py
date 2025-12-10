import importlib
from pathlib import Path
import sys

from fastapi.testclient import TestClient
import pytest

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
  sys.path.insert(0, str(ROOT_DIR))


def _reload_app_with_db():
  """
  Reload app.db and app.main so the engine/session pick up the provided DATABASE_URL.
  """
  import app.db as app_db

  importlib.reload(app_db)

  import app.main as app_main

  importlib.reload(app_main)
  return app_main


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
  db_file = tmp_path / "integration.db"
  db_url = f"sqlite:///{db_file}"
  monkeypatch.setenv("DATABASE_URL", db_url)
  app_module = _reload_app_with_db()
  app_module.db.reset()
  with TestClient(app_module.app) as client:
    try:
      yield client
    finally:
      # Restore app modules to their defaults so other tests are unaffected.
      import app.db as app_db
      import app.main as app_main

      importlib.reload(app_db)
      importlib.reload(app_main)


def test_full_flow_persists_scores(client: TestClient):
  signup = client.post("/auth/signup", json={"username": "e2e-user", "password": "pw"})
  assert signup.status_code == 201
  login = client.post("/auth/login", json={"username": "e2e-user", "password": "pw"})
  assert login.status_code == 200

  record = client.post("/scores", json={"username": "e2e-user", "score": 15, "mode": "walls"})
  assert record.status_code == 204

  leaderboard = client.get("/leaderboard")
  assert leaderboard.status_code == 200
  rows = leaderboard.json()
  entry = next(row for row in rows if row["player"] == "e2e-user")
  assert entry["bestScore"] == 15
  assert entry["totalRuns"] == 1
  assert entry["modeBreakdown"]["walls"] == 1
