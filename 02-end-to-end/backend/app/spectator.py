from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import List

from app.schemas import GameMode, Point, SpectatorSnapshot


@dataclass
class SpectatorState:
  id: str
  player: str
  mode: GameMode
  grid_size: int
  snake: List[Point]
  food: Point
  score: int


class SpectatorEngine:
  def __init__(self, grid_size: int = 12) -> None:
    self._grid_size = grid_size
    self._states: List[SpectatorState] = [
      self._initial_state(index, name) for index, name in enumerate(["Drift", "Echo", "Pulse"])
    ]

  def reset(self) -> None:
    self.__init__(grid_size=self._grid_size)

  def _initial_state(self, index: int, player: str) -> SpectatorState:
    start = (index + 2) % self._grid_size
    snake = [Point(x=start, y=start), Point(x=start - 1, y=start), Point(x=start - 2, y=start)]
    food = self._random_food(snake)
    mode: GameMode = "walls" if index % 2 == 0 else "pass-through"
    return SpectatorState(
      id=f"spectator-{index}",
      player=player,
      mode=mode,
      grid_size=self._grid_size,
      snake=snake,
      food=food,
      score=random.randint(0, 12),
    )

  def _random_food(self, snake: List[Point]) -> Point:
    for _ in range(self._grid_size * 3):
      candidate = Point(x=random.randrange(self._grid_size), y=random.randrange(self._grid_size))
      if all(segment.x != candidate.x or segment.y != candidate.y for segment in snake):
        return candidate
    return Point(x=0, y=0)

  def _wrap(self, coord: int) -> int:
    return coord % self._grid_size

  def tick(self) -> None:
    directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    for state in self._states:
      dx, dy = random.choice(directions)
      head = state.snake[0]
      next_head = Point(x=head.x + dx, y=head.y + dy)
      if state.mode == "pass-through":
        next_head = Point(x=self._wrap(next_head.x), y=self._wrap(next_head.y))
      else:
        if next_head.x < 0 or next_head.x >= state.grid_size or next_head.y < 0 or next_head.y >= state.grid_size:
          # Respawn on wall collision to keep stream lively.
          state.snake = self._initial_state(0, state.player).snake
          state.food = self._random_food(state.snake)
          state.score = 0
          continue

      ate_food = next_head.x == state.food.x and next_head.y == state.food.y
      if ate_food:
        state.snake = [next_head] + state.snake
        state.score += 1
        state.food = self._random_food(state.snake)
      else:
        state.snake = [next_head] + state.snake[:-1]

  def snapshots(self) -> List[SpectatorSnapshot]:
    now_ms = int(time.time() * 1000)
    return [
      SpectatorSnapshot(
        id=state.id,
        player=state.player,
        mode=state.mode,
        snake=state.snake,
        food=state.food,
        score=state.score,
        gridSize=state.grid_size,
        updatedAt=now_ms,
      )
      for state in self._states
    ]
