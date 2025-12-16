# Collaborative Coding Interview Platform

Real-time coding interview workspace with shareable rooms, Monaco editor, Socket.IO collaboration, and in-browser sandboxed execution for JavaScript and Python (Pyodide).

## Quick start (Codespaces/local)

1. From `02-end-to-end/homework`: `npm install`
2. Run both apps: `npm run dev`
3. Open the frontend: http://localhost:5173
4. Backend runs at http://localhost:4000

## Using it

- Click **Create interview** to get a room link like `/r/<roomId>`.
- Share the URL; everyone joining sees the same code and language in real time.
- Switch syntax highlighting between JavaScript, TypeScript, and Python (Run supports JS and Python; TypeScript coming soon).
- Press **Run** to execute code safely inside a Web Worker (2s timeout, console logs captured). Python runs via Pyodide loaded inside the worker.
  - Backend docs page: http://localhost:4000/docs

### Collaboration tip

Open two browser tabs with the same `/r/<roomId>` URL to see live code and language syncing via Socket.IO.

### Tests (Playwright)

- One-time: `npx playwright install --with-deps chromium`
- Run integration tests: `npm test` (starts frontend+backend, then Playwright headless)
- Headless is the default; runs fine in Codespaces.
- If you see "No tests found", update to the latest code and ensure config resolves to `tests/`.

## Docker Compose (optional)

```
docker-compose up
```

Frontend: http://localhost:5173  
Backend: http://localhost:4000

## Project structure

- `backend/`: Express + Socket.IO, in-memory room state, `POST /api/rooms`, `/docs`, OpenAPI spec at `/openapi.yaml`
- `frontend/`: React + Vite + Monaco editor + Web Worker sandbox
- `docker-compose.yml`: runs frontend and backend together
