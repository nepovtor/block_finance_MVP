# Block Finance MVP

Block Finance MVP is a hackathon-ready demo for a banking + block puzzle product.
The flow is simple:
- user lands in the frontend
- opens the dashboard
- makes a demo coffee payment
- receives a reward from the backend
- starts a block puzzle game
- finishes the game and receives XP

## Repository structure

- `backend_block-finance_mvp` — FastAPI backend with SQLite for local demo data
- `frontend_block_finance_mvp` — Vite + React frontend

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Environment setup

Backend:

```bash
cd backend_block-finance_mvp
cp .env.example .env
```

Frontend:

```bash
cd frontend_block_finance_mvp
cp .env.example .env
```

Default local URLs:
- backend: `http://localhost:8000`
- frontend: `http://localhost:5173`

## Run backend

```bash
cd backend_block-finance_mvp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Run frontend

```bash
cd frontend_block_finance_mvp
npm install
npm run dev
```

## Demo scenario

1. Open `http://localhost:5173`
2. Click `Start`
3. On the dashboard, click `Pay for coffee`
4. The frontend sends `POST /transactions/demo` to the backend
5. The backend returns an `extra_move` reward
6. The dashboard updates the reward card
7. Click `Go to game`
8. Finish a game and receive XP from the backend

## Common issues

- `CORS` error:
  Check that the frontend is running on `http://localhost:5173` and backend `.env` allows that origin.
- `Failed to fetch` in the frontend:
  Confirm `frontend_block_finance_mvp/.env` contains `VITE_API_URL=http://localhost:8000`.
- `Module not found` or missing React types:
  Run `npm install` inside `frontend_block_finance_mvp`.
- Backend cannot start:
  Activate the virtual environment and install `requirements.txt`.
