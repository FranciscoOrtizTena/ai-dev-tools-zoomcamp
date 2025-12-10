import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
  sys.path.insert(0, str(ROOT_DIR))

from app.main import app, db, spectator_engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
  db.reset()
  spectator_engine.reset()


def test_signup_and_duplicate_signup():
  response = client.post("/auth/signup", json={"username": "pilot", "password": "pw"})
  assert response.status_code == 201
  body = response.json()
  assert body["user"]["username"] == "pilot"
  duplicate = client.post("/auth/signup", json={"username": "pilot", "password": "pw"})
  assert duplicate.status_code == 409


def test_login_invalid_password():
  client.post("/auth/signup", json={"username": "ace", "password": "pw"})
  response = client.post("/auth/login", json={"username": "ace", "password": "bad"})
  assert response.status_code == 401


def test_record_score_updates_leaderboard():
  client.post("/auth/signup", json={"username": "runner", "password": "pw"})
  record = client.post("/scores", json={"username": "runner", "score": 9, "mode": "walls"})
  assert record.status_code == 204
  leaderboard = client.get("/leaderboard").json()
  entry = next(row for row in leaderboard if row["player"] == "runner")
  assert entry["bestScore"] == 9
  assert entry["totalRuns"] == 1
  assert entry["modeBreakdown"]["walls"] == 1


def test_spectator_snapshots_shape():
  response = client.get("/spectator/snapshots")
  assert response.status_code == 200
  snapshots = response.json()
  assert isinstance(snapshots, list)
  assert snapshots, "Expected at least one snapshot"
  sample = snapshots[0]
  assert {"id", "player", "mode", "snake", "food", "score", "gridSize", "updatedAt"} <= set(sample.keys())


def test_sse_stream_emits_events():
  with client.stream("GET", "/spectator/stream?limit=1") as response:
    assert response.status_code == 200
    event_payload = None
    for line in response.iter_lines():
      if line.startswith("data: "):
        event_payload = json.loads(line.replace("data: ", "", 1).strip())
        break
  assert event_payload is not None
  assert isinstance(event_payload, list)
  assert event_payload and "player" in event_payload[0]


def test_leaderboard_preflight_allowed():
  response = client.options("/leaderboard")
  assert response.status_code == 200
  allow_methods = response.headers.get("access-control-allow-methods", "").lower()
  assert "get" in allow_methods
