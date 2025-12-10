import asyncio
import json
from typing import AsyncIterator

from fastapi import FastAPI, status
from fastapi.responses import JSONResponse, Response, StreamingResponse

from app.db import MockDatabase
from app.schemas import AuthRequest, ErrorResponse, LeaderboardEntry, ScoreRequest, Session, SpectatorSnapshot
from app.spectator import SpectatorEngine

app = FastAPI(title="Snake Ops API", version="1.0.0")

db = MockDatabase()
spectator_engine = SpectatorEngine()


@app.post(
  "/auth/signup",
  response_model=Session,
  status_code=status.HTTP_201_CREATED,
  responses={status.HTTP_409_CONFLICT: {"model": ErrorResponse}},
)
async def sign_up(payload: AuthRequest):
  try:
    return db.sign_up(payload.username, payload.password)
  except ValueError as exc:
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"message": str(exc)})


@app.post(
  "/auth/login",
  response_model=Session,
  status_code=status.HTTP_200_OK,
  responses={status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}},
)
async def login(payload: AuthRequest):
  try:
    return db.login(payload.username, payload.password)
  except ValueError as exc:
    return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"message": str(exc)})


@app.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard():
  return db.leaderboard()


@app.post(
  "/scores",
  status_code=status.HTTP_204_NO_CONTENT,
  responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse}},
)
async def record_score(payload: ScoreRequest):
  try:
    db.record_score(payload.username, payload.score, payload.mode)
  except KeyError as exc:
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"message": str(exc)})
  return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/spectator/snapshots", response_model=list[SpectatorSnapshot])
async def spectator_snapshots():
  spectator_engine.tick()
  return spectator_engine.snapshots()


def _format_sse(data: list[SpectatorSnapshot]) -> str:
  return f"data: {json.dumps([snapshot.model_dump() for snapshot in data])}\n\n"


@app.get("/spectator/stream")
async def spectator_stream(limit: int | None = None):
  sent = 0

  async def generator():
    nonlocal sent
    try:
      yield _format_sse(spectator_engine.snapshots())
      sent += 1
      if limit and sent >= limit:
        return
      while True:
        await asyncio.sleep(1.5)
        spectator_engine.tick()
        yield _format_sse(spectator_engine.snapshots())
        sent += 1
        if limit and sent >= limit:
          return
    except asyncio.CancelledError:
      return

  return StreamingResponse(generator(), media_type="text/event-stream")


if __name__ == "__main__":
  import uvicorn

  uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
