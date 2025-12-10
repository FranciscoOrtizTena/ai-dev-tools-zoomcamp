from __future__ import annotations

import os
import uuid
from contextlib import AbstractContextManager, contextmanager
from typing import Callable, Dict

from sqlalchemy import CheckConstraint, Engine, String, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.schemas import GameMode, LeaderboardEntry, Session as SessionSchema, UserProfile

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./snake_ops.db")

_is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if _is_sqlite else {}
engine: Engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)


class Base(DeclarativeBase):
  pass


class User(Base):
  __tablename__ = "users"

  id: Mapped[str] = mapped_column(String, primary_key=True)
  username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
  normalized_username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
  password: Mapped[str] = mapped_column(String(255), nullable=False)
  best_score: Mapped[int] = mapped_column(default=0)
  total_runs: Mapped[int] = mapped_column(default=0)
  pass_through_runs: Mapped[int] = mapped_column(default=0)
  walls_runs: Mapped[int] = mapped_column(default=0)

  __table_args__ = (
    CheckConstraint("best_score >= 0"),
    CheckConstraint("total_runs >= 0"),
    CheckConstraint("pass_through_runs >= 0"),
    CheckConstraint("walls_runs >= 0"),
  )

  def mode_breakdown(self) -> Dict[GameMode, int]:
    return {"pass-through": self.pass_through_runs, "walls": self.walls_runs}


@contextmanager
def session_scope(session_factory: Callable[[], Session]) -> AbstractContextManager[Session]:
  session = session_factory()
  try:
    yield session
    session.commit()
  except Exception:
    session.rollback()
    raise
  finally:
    session.close()


class Database:
  def __init__(self, session_factory: Callable[[], Session], engine: Engine):
    self._session_factory = session_factory
    self.engine = engine

  def init_db(self) -> None:
    Base.metadata.create_all(bind=self.engine)
    self._seed_if_empty()

  def _seed_if_empty(self) -> None:
    with session_scope(self._session_factory) as session:
      existing = session.scalar(select(func.count()).select_from(User))
      if existing and existing > 0:
        return
      seeds = [("nova", "nova"), ("orbit", "orbit"), ("lumen", "lumen")]
      for index, (username, password) in enumerate(seeds):
        user = User(
          id=f"seed-{index}",
          username=username,
          normalized_username=username.lower(),
          password=password,
          best_score=5 + index * 3,
          total_runs=4 + index,
          pass_through_runs=2,
          walls_runs=2 + index,
        )
        session.add(user)

  def reset(self) -> None:
    Base.metadata.drop_all(bind=self.engine)
    Base.metadata.create_all(bind=self.engine)
    self._seed_if_empty()

  @staticmethod
  def _normalize_username(username: str) -> str:
    return username.strip().lower()

  @staticmethod
  def _create_token() -> str:
    return f"session-{uuid.uuid4()}"

  def sign_up(self, username: str, password: str) -> SessionSchema:
    normalized = self._normalize_username(username)
    with session_scope(self._session_factory) as session:
      existing = session.scalar(select(User).where(User.normalized_username == normalized))
      if existing:
        raise ValueError("User already exists")
      user = User(
        id=f"user-{uuid.uuid4()}",
        username=username.strip(),
        normalized_username=normalized,
        password=password,
      )
      session.add(user)
      session.flush()
      token = self._create_token()
      return SessionSchema(token=token, user=UserProfile(id=user.id, username=user.username))

  def login(self, username: str, password: str) -> SessionSchema:
    normalized = self._normalize_username(username)
    with session_scope(self._session_factory) as session:
      user = session.scalar(select(User).where(User.normalized_username == normalized))
      if not user or user.password != password:
        raise ValueError("Invalid credentials")
      token = self._create_token()
      return SessionSchema(token=token, user=UserProfile(id=user.id, username=user.username))

  def record_score(self, username: str, score: int, mode: GameMode) -> None:
    normalized = self._normalize_username(username)
    with session_scope(self._session_factory) as session:
      user = session.scalar(select(User).where(User.normalized_username == normalized))
      if not user:
        raise KeyError("Player not found")
      user.total_runs += 1
      if mode == "pass-through":
        user.pass_through_runs += 1
      else:
        user.walls_runs += 1
      if score > user.best_score:
        user.best_score = score
      session.add(user)

  def leaderboard(self) -> list[LeaderboardEntry]:
    with session_scope(self._session_factory) as session:
      rows = session.scalars(select(User)).all()
      entries = [
        LeaderboardEntry(
          player=row.username,
          bestScore=row.best_score,
          totalRuns=row.total_runs,
          modeBreakdown=row.mode_breakdown(),
        )
        for row in rows
      ]
    return sorted(entries, key=lambda entry: entry.bestScore, reverse=True)


db = Database(SessionLocal, engine)
