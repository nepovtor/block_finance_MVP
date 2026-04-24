# Backend

FastAPI backend for the Block Finance MVP. It powers:
- demo payment rewards
- game session lifecycle
- demo user profile

## Run locally

1. Create a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create env file:

```bash
cp .env.example .env
```

For local development, set:

```env
DATABASE_URL=sqlite+aiosqlite:///./test.db
SECRET_KEY=dev-secret-key
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ENVIRONMENT=development
```

4. Start the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend starts on `http://localhost:8000` locally and is also reachable on your LAN IP, for example `http://192.168.1.50:8000`.

## Useful endpoints

- `GET /health`
- `GET /ready`
- `GET /users/1`
- `POST /transactions/demo`
- `POST /game/start?user_id=1`
- `POST /game/finish?session_id=<id>&score=<score>`

## Railway deployment

1. Push this repository to GitHub.
2. In Railway, create a new project.
3. Add a service from GitHub and point it at this repository.
4. Set the service root directory to `backend_block-finance_mvp` if Railway does not detect it automatically.
5. Add a Railway PostgreSQL service.
6. Set backend environment variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=generate-a-real-secret
CORS_ORIGINS=https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
ENVIRONMENT=production
```

7. Railway will use `railway.json` and start the API with:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

8. Generate a public Railway domain for the backend service.
9. Confirm `GET /health` and `GET /ready` work on the public URL.
