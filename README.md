# Block Finance MVP

Block Finance MVP is a hackathon-ready product demo for a youth banking experience with a built-in block puzzle reward loop.

Core idea:
- money action -> instant reward
- reward -> gameplay advantage
- gameplay -> progress and XP

This makes the repo demo-friendly in under a minute: a user pays for coffee, unlocks an `extra_move`, uses it inside the game, and sees progress update across one connected experience.

## Why this is valuable

- Turns routine card activity into something visible and rewarding
- Makes loyalty mechanics feel playful instead of hidden
- Gives judges and teammates one clear retention story in 30-60 seconds

## Screenshots

- `docs/screenshot-dashboard.png` - dashboard with payment and reward
- `docs/screenshot-game.png` - game board with active reward
- `docs/screenshot-game-over.png` - revive moment / restart flow

These are placeholders for demo assets you can capture locally.

## Repository structure

- `backend_block-finance_mvp` — FastAPI backend with SQLite for local demo data
- `frontend_block_finance_mvp` — Vite + React frontend
- `demo_script.md` — 30-60 second live demo talk track

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

For phone testing on the same Wi-Fi, replace `localhost` with your computer's LAN IP in the frontend `.env` file.

## Run backend

```bash
cd backend_block-finance_mvp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend LAN URL example:
- `http://192.168.1.50:8000`

## Run frontend

```bash
cd frontend_block_finance_mvp
npm install
npm run dev
```

The Vite config is set to listen on `0.0.0.0`, so it is reachable from other devices on your local network.

Frontend LAN URL example:
- `http://192.168.1.50:5173`

## Phone testing on same Wi-Fi

1. Find your computer's LAN IP:

```bash
ipconfig getifaddr en0
```

If that returns nothing on macOS, try:

```bash
ipconfig getifaddr en1
```

2. Put that IP into the frontend env file:

```bash
cd frontend_block_finance_mvp
cp .env.example .env
```

Then edit `.env` so it looks like:

```env
VITE_API_URL=http://YOUR_LAN_IP:8000
```

3. Start the backend for LAN access:

```bash
cd backend_block-finance_mvp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. Start the frontend for LAN/mobile access:

```bash
cd frontend_block_finance_mvp
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

5. Open the app on your phone:
- connect the phone to the same Wi-Fi network as your computer
- open `http://YOUR_LAN_IP:5173`
- verify the dashboard loads, `Pay for coffee` works, and the game opens
- place pieces on the board and confirm there is no horizontal scrolling

## Demo scenario

1. Open `http://localhost:5173`
2. Click `Start live demo`
3. On the dashboard, show the user profile, XP, streak, and reward panel
4. Click `Pay for coffee`
5. The frontend sends `POST /transactions/demo` to the backend
6. The backend returns an `extra_move` reward
7. The dashboard reward card lights up immediately
8. Click `Play game`
9. Play until no valid moves remain
10. Use the extra move reward if available
11. Save score and restart the run

## Product flow

1. Dashboard frames the story: finance activity creates momentum
2. Payment action triggers backend reward logic
3. Reward is made visible before the user enters the game
4. Game reflects the reward and lets the player consume it once
5. End of run feeds back into XP and retention story

## Common issues

- `CORS` error:
  Check that the frontend origin matches your LAN IP and that backend `.env` allows that origin or keeps the default LAN regex.
- `Failed to fetch` in the frontend:
  Confirm `frontend_block_finance_mvp/.env` contains `VITE_API_URL=http://YOUR_LAN_IP:8000`.
- `Module not found` or missing React types:
  Run `npm install` inside `frontend_block_finance_mvp`.
- Backend cannot start:
  Activate the virtual environment and install `requirements.txt`.
- Backend uses an unexpected Postgres database:
  Replace any old `backend_block-finance_mvp/.env` with values from `.env.example` for the simplest local SQLite demo.
- Reward does not show after payment:
  Refresh the dashboard profile once and confirm the backend is using the same local database configured in `.env`.
- Frontend opens but styling looks plain:
  Hard-refresh the browser to pick up the latest Vite CSS bundle.
