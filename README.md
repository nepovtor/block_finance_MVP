# Block Finance MVP

Block Finance MVP is a hackathon-ready product demo for a youth banking experience with a built-in block puzzle reward loop.

Core idea:
- money action -> instant reward
- reward -> gameplay advantage
- gameplay -> progress and XP

This makes the repo demo-friendly in under a minute: a user pays for coffee, unlocks an `extra_move`, advances a visible challenge, tops up a savings goal, sees a referral block, then uses the reward inside the game.

## Why this is valuable

- Turns routine card activity into something visible and rewarding
- Makes loyalty mechanics feel playful instead of hidden
- Gives judges and teammates one clear retention story in 30-60 seconds

## Why this is valuable for the bank and the client

For the bank:
- More card engagement through visible daily challenges
- A savings habit layer that supports balances and retention
- Referral surfaces that make the concept easier to share and grow
- Basic analytics events that show where activation and replay happen

For the client:
- Immediate gratification after a real money action
- Clear progress on both challenges and savings
- A game reward that feels earned instead of random
- A lighter, more motivating banking experience

## Screenshots

- `docs/screenshot-dashboard.png` - dashboard with payment and reward
- `docs/screenshot-game.png` - game board with active reward
- `docs/screenshot-game-over.png` - revive moment / restart flow

These are placeholders for demo assets you can capture locally.

## Repository structure

- `backend_block-finance_mvp` — FastAPI backend with SQLite for local demo data
- `frontend_block_finance_mvp` — Vite + React frontend
- `demo_script.md` — 30-60 second live demo talk track
- `product_canvas.md` — pitch notes and product framing for hackathon defense

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

For phone testing on the same Wi-Fi, replace `localhost` with your computer's LAN IP in the frontend `.env` file. The backend CORS setup already accepts localhost plus common private-network IP ranges such as `192.168.x.x`, `10.x.x.x`, and `172.16-31.x.x`.

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
npm run dev -- --host 0.0.0.0 --port 5173
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
- confirm glowing board anchors appear after selecting a piece
- confirm placed piece colors stay visible after placement

## Phone demo checklist

1. Dashboard opens on `http://YOUR_LAN_IP:5173`.
2. `Pay for coffee` succeeds without a network or CORS error.
3. The reward card updates and shows the new reward.
4. The game opens from the dashboard.
5. Tapping a piece, then a glowing board cell, places the piece correctly.
6. Placed colors and finance overlays remain visible on the board.
7. If a reward is available, it is visible in the game and can be used from the game-over state.
8. `Quick restart` or `Save score and play again` starts a fresh run cleanly.

## Demo scenario

1. Open `http://localhost:5173`
2. Click `Start 15-sec demo`
3. On the dashboard, point out the `First quest` strip, the daily challenge card, the savings goal, and the referral block
4. Click `Pay for coffee`
5. The frontend sends `POST /transactions/demo` to the backend
6. The backend returns an `extra_move` reward
7. The dashboard reward card lights up immediately and the daily challenge advances to `1/3`
8. Click `Add $5` on the savings goal to show visible saving progress and the XP bonus
9. Click `Invite a friend` to simulate referral growth and populate analytics
10. Click `Play game`
11. Play until no valid moves remain
12. Use the extra move reward if available
13. Save score and restart the run

## Product flow

1. Onboarding explains the loop in 5-8 seconds
2. Dashboard frames the story: finance activity creates momentum
3. Payment action triggers backend reward logic and challenge progress
4. Savings and referral blocks show broader product scope around the same user
5. Reward is made visible before the user enters the game
6. Game reflects the reward and lets the player consume it once
7. End of run feeds back into XP and retention story

## Analytics events

The frontend includes a lightweight analytics wrapper in `frontend_block_finance_mvp/src/services/analytics.ts`.

Tracked demo events:
- `app_open`
- `payment_made`
- `reward_received`
- `game_started`
- `game_finished`
- `referral_clicked`

Implementation notes:
- Events are logged to `console`
- Events are stored in browser `localStorage`
- The dashboard shows the latest events in an `Analytics pulse` block for demo narration

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
