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
VITE_API_BASE_URL=http://YOUR_LAN_IP:8000
```

If you only want laptop-only local testing, `VITE_API_BASE_URL=http://localhost:8000` also works.

4. Start the dev server:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

The frontend starts on `http://localhost:5173` on your computer and is also reachable on `http://YOUR_LAN_IP:5173` from a phone on the same Wi-Fi network.

## Railway / production configuration

Set the frontend environment variable below to the public Railway backend URL:

```env
VITE_API_BASE_URL=https://your-backend-service.up.railway.app
```

Typical deployment flow:

1. Create a Railway project for the backend.
2. Add the backend service from GitHub.
3. Set the backend root directory to `backend_block-finance_mvp` if needed.
4. Add a PostgreSQL service in Railway.
5. Set backend variables: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`.
6. Generate a public Railway domain for the backend.
7. Set `VITE_API_BASE_URL` in the frontend deployment to that Railway backend URL.
