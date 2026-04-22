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

3. Start the dev server:

```bash
npm run dev
```

The frontend starts on `http://localhost:5173`.

## Expected backend

Set `VITE_API_URL` to the FastAPI server, for example:

```env
VITE_API_URL=http://localhost:8000
```
