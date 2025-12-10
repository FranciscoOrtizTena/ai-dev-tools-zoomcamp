from typing import Dict, List, Literal

from pydantic import BaseModel, Field

GameMode = Literal["pass-through", "walls"]


class Point(BaseModel):
  x: int
  y: int


class UserProfile(BaseModel):
  id: str
  username: str


class Session(BaseModel):
  token: str
  user: UserProfile


class LeaderboardEntry(BaseModel):
  player: str
  bestScore: int = Field(ge=0)
  totalRuns: int = Field(ge=0)
  modeBreakdown: Dict[GameMode, int]


class SpectatorSnapshot(BaseModel):
  id: str
  player: str
  mode: GameMode
  snake: List[Point]
  food: Point
  score: int = Field(ge=0)
  gridSize: int = Field(ge=1)
  updatedAt: int


class AuthRequest(BaseModel):
  username: str = Field(min_length=1)
  password: str = Field(min_length=1)


class ScoreRequest(BaseModel):
  username: str = Field(min_length=1)
  score: int = Field(ge=0)
  mode: GameMode


class ErrorResponse(BaseModel):
  message: str
