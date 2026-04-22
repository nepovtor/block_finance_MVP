# Frontend

Vite + React frontend for the Block Finance MVP.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Point the frontend to the backend:

```env
VITE_API_URL=http://YOUR_LAN_IP:8000
```

If you only want laptop-only local testing, `VITE_API_URL=http://localhost:8000` also works.

4. Start the dev server:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

The frontend starts on `http://localhost:5173` on your computer and is also reachable on `http://YOUR_LAN_IP:5173` from a phone on the same Wi-Fi network.
