## Running frontend and backend together

This workspace ships a small helper that uses `concurrently` to launch both apps.

1) Install the helper dependency (once):  
   ```bash
   cd 02-end-to-end
   npm install
   ```
   _Requires uv available in your PATH for the backend command._

2) Start both services:  
   ```bash
   npm run dev
   ```
   - Backend: FastAPI on `http://localhost:8000` (reload on change).
   - Frontend: Vite dev server on `http://localhost:5173` (host/port set explicitly).

Extra scripts:
- `npm run dev:backend` – backend only.
- `npm run dev:frontend` – frontend only.

If your backend runs elsewhere, set `VITE_API_BASE_URL` before `npm run dev:frontend` (or in your env) so the UI points to the correct API.

## Docker Compose stack

Run everything (frontend via Nginx, FastAPI backend, and Postgres) with one command:

```bash
cd 02-end-to-end
docker compose up --build
```

- Frontend: http://localhost:5173 (proxies `/api/*` to the backend).
- Backend: http://localhost:8000
- Postgres: exposed on `localhost:5432` (user/password/db: `snake_ops`).

If you want to point the built frontend at a different API URL, rebuild with `--build-arg API_BASE_URL=https://your-api.example.com` on the frontend service.
