import cors from "cors";
import express from "express";
import http from "http";
import { randomUUID } from "crypto";
import { Server } from "socket.io";

type RoomState = {
  code: string;
  language: string;
};

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);
app.use(express.json());

const rooms = new Map<string, RoomState>();

const defaultState: RoomState = {
  code: "// Start coding together\n",
  language: "javascript",
};

app.post("/api/rooms", (_req, res) => {
  const roomId = randomUUID().slice(0, 8);
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { ...defaultState });
  }
  res.json({ roomId });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN },
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId: string) => {
    if (!roomId) return;
    socket.join(roomId);
    const state = rooms.get(roomId) ?? { ...defaultState };
    rooms.set(roomId, state);
    socket.emit("room-state", state);
  });

  socket.on("code-update", ({ roomId, code }: { roomId: string; code: string }) => {
    if (!roomId) return;
    const state = rooms.get(roomId) ?? { ...defaultState };
    state.code = code;
    rooms.set(roomId, state);
    socket.to(roomId).emit("code-update", code);
  });

  socket.on("language-update", ({ roomId, language }: { roomId: string; language: string }) => {
    if (!roomId) return;
    const state = rooms.get(roomId) ?? { ...defaultState };
    state.language = language;
    rooms.set(roomId, state);
    socket.to(roomId).emit("language-update", language);
  });
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
