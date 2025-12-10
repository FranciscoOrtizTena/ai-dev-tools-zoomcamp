from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from threading import Lock
from typing import Dict

from app.schemas import GameMode, LeaderboardEntry, Session, UserProfile


@dataclass
class StoredUser:
  id: str
  username: str
  password: str
  best_score: int = 0
  total_runs: int = 0
  mode_breakdown: Dict[GameMode, int] = field(default_factory=lambda: {"pass-through": 0, "walls": 0})


class MockDatabase:
  def __init__(self) -> None:
    self._users: Dict[str, StoredUser] = {}
    self._tokens: Dict[str, str] = {}
    self._lock = Lock()
    self._seed()

  def _seed(self) -> None:
    seeds = [("nova", "nova"), ("orbit", "orbit"), ("lumen", "lumen")]
    for index, (username, password) in enumerate(seeds):
      stored = StoredUser(
        id=f"seed-{index}",
        username=username,
        password=password,
        best_score=5 + index * 3,
        total_runs=4 + index,
        mode_breakdown={"pass-through": 2, "walls": 2 + index},
      )
      self._users[username.lower()] = stored

  @staticmethod
  def _normalize_username(username: str) -> str:
    return username.strip().lower()

  def _create_token(self, username: str) -> str:
    token = f"session-{uuid.uuid4()}"
    self._tokens[token] = username
    return token

  def reset(self) -> None:
    with self._lock:
      self._users.clear()
      self._tokens.clear()
      self._seed()

  def sign_up(self, username: str, password: str) -> Session:
    normalized = self._normalize_username(username)
    with self._lock:
      if normalized in self._users:
        raise ValueError("User already exists")
      stored = StoredUser(
        id=f"user-{len(self._users) + 1}",
        username=username.strip(),
        password=password,
      )
      self._users[normalized] = stored
      token = self._create_token(normalized)
      return Session(token=token, user=UserProfile(id=stored.id, username=stored.username))

  def login(self, username: str, password: str) -> Session:
    normalized = self._normalize_username(username)
    with self._lock:
      user = self._users.get(normalized)
      if not user or user.password != password:
        raise ValueError("Invalid credentials")
      token = self._create_token(normalized)
      return Session(token=token, user=UserProfile(id=user.id, username=user.username))

  def record_score(self, username: str, score: int, mode: GameMode) -> None:
    normalized = self._normalize_username(username)
    with self._lock:
      user = self._users.get(normalized)
      if not user:
        raise KeyError("Player not found")
      user.total_runs += 1
      user.mode_breakdown[mode] = user.mode_breakdown.get(mode, 0) + 1
      if score > user.best_score:
        user.best_score = score

  def leaderboard(self) -> list[LeaderboardEntry]:
    with self._lock:
      entries = [
        LeaderboardEntry(
          player=user.username,
          bestScore=user.best_score,
          totalRuns=user.total_runs,
          modeBreakdown=user.mode_breakdown,
        )
        for user in self._users.values()
      ]
    return sorted(entries, key=lambda entry: entry.bestScore, reverse=True)
