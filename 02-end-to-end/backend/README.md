## Snake Ops FastAPI backend

Run locally:

```bash
uv run uvicorn app.main:app --reload
```

Run tests:

```bash
uv run pytest
```

Integration tests (SQLite-backed end-to-end):

```bash
uv run pytest tests_integration
```

### Database

- Default database is SQLite stored at `backend/snake_ops.db`.
- Override with Postgres (or any SQLAlchemy URL) via `DATABASE_URL`, e.g.:

```bash
export DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/snake_ops"
uv run uvicorn app.main:app --reload
```
