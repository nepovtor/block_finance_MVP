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

4. Start the API:

```bash
uvicorn app.main:app --reload
```

The backend starts on `http://localhost:8000`.

## Useful endpoints

- `GET /health`
- `GET /users/1`
- `POST /transactions/demo`
- `POST /game/start?user_id=1`
- `POST /game/finish?session_id=<id>&score=<score>`
