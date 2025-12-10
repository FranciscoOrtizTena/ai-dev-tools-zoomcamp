import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse

from app.db import db as database
from app.schemas import AuthRequest, ErrorResponse, LeaderboardEntry, ScoreRequest, Session, SpectatorSnapshot
from app.spectator import SpectatorEngine

spectator_engine = SpectatorEngine()
db = database


@asynccontextmanager
async def lifespan(_app):
  database.init_db()
  yield


app = FastAPI(title="Snake Ops API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.post(
  "/auth/signup",
  response_model=Session,
  status_code=status.HTTP_201_CREATED,
  responses={status.HTTP_409_CONFLICT: {"model": ErrorResponse}},
)
async def sign_up(payload: AuthRequest):
  try:
    return database.sign_up(payload.username, payload.password)
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
    return database.login(payload.username, payload.password)
  except ValueError as exc:
    return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"message": str(exc)})


@app.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard():
  return database.leaderboard()


@app.options("/leaderboard")
async def leaderboard_options():
  return Response(
    status_code=status.HTTP_200_OK,
    headers={
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  )


@app.post(
  "/scores",
  status_code=status.HTTP_204_NO_CONTENT,
  responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse}},
)
async def record_score(payload: ScoreRequest):
  try:
    database.record_score(payload.username, payload.score, payload.mode)
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
