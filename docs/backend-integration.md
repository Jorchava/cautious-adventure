# Backend Integration

Neon Reels ships with **json-server** as a zero-config local history API.
This works perfectly for local development and for exploring the codebase.

For a live deployment, you have two options: run without a backend (history
panel shows an offline notice) or connect a real backend service.

---

## How the History API Works

All history reads and writes go through one interface:

```typescript
// src/game/services/HistoryService.ts
export interface HistoryService {
  getHistory(limit?: number): Promise<SpinRecord[]>
  recordSpin(record: Omit<SpinRecord, 'id'>): Promise<SpinRecord>
}
```

`ClientHistoryService` implements this interface using `fetch()` against a
configurable base URL. The base URL is controlled by a single environment
variable: `VITE_API_BASE_URL`.

| Environment | Value | Result |
|-------------|-------|--------|
| Local dev | not set | defaults to `http://localhost:3001` |
| Netlify (no backend) | not set | fetch fails → history panel shows offline notice |
| Netlify + backend | `https://your-api.example.com` | full history works |

---

## Option A: Deploy Without a Backend (Live Demo)

This is the simplest path. Deploy the frontend to Netlify with no
`VITE_API_BASE_URL` set. The history panel shows an offline notice — this
is intentional behavior, not a bug.

The game is fully playable. Spins work, wins work, free spins work. Only
the history persistence panel is affected.

**What visitors see:**

```
HISTORY
ℹ  History requires an API backend.
   See README for local setup.
```

No red error messages, no broken UI. The notice links to the README setup
instructions.

---

## Option B: Connect a Real Backend

The `HistoryService` interface accepts any backend that speaks HTTP and
returns data in the `SpinRecord` shape. You can connect:

- **json-server on Railway/Render** — quickest path, free tiers available
- **Supabase** — PostgreSQL with auto-generated REST API, generous free tier
- **PocketBase** — self-hosted SQLite with REST, single binary
- **Any REST API** — Node/Express, Fastify, Laravel, whatever you prefer

### Step 1: Stand up your backend

Your backend needs two endpoints:

```
GET  /history?_sort=-timestamp&_limit=10   → SpinRecord[]
POST /history                              → SpinRecord (with server-generated id)
```

The `SpinRecord` shape:

```typescript
interface SpinRecord {
  id: string
  timestamp: string   // ISO 8601
  bet: number
  win: number
  freeSpinsAwarded: number
}
```

Enable CORS for your Netlify domain.

### Step 2: Set the environment variable

In your Netlify dashboard → Site → Environment variables:

```
VITE_API_BASE_URL = https://your-api-url.example.com
```

Redeploy. The game will use your backend automatically.

### Step 3 (optional): Write a custom service

If your backend has a different API shape, implement the `HistoryService`
interface and swap it at the DI boundary in `useHistoryStore`:

```typescript
// src/stores/useHistoryStore.ts
// Change the default service
let service: HistoryService = new YourCustomHistoryService()
```

No other code changes needed.

---

## Local Development with json-server

```bash
pnpm install
cp db.example.json db.json
pnpm api          # Starts json-server on http://localhost:3001
pnpm dev          # Starts Vite on http://localhost:5173
```

All history features work locally without any environment variable.
The game automatically falls back to `http://localhost:3001` when
`VITE_API_BASE_URL` is not set.

---

## What Is Missing for Production Gambling

This project is a frontend demo. A production gambling system requires:

- **Certified server-side RNG** — client-side RNG cannot be audited or certified
- **Gaming licenses** — jurisdiction-specific, expensive, time-consuming
- **Player authentication and session management**
- **Anti-fraud and responsible gambling controls**
- **Real payment processing**

See the [LICENSE](./LICENSE) for the full disclaimer.
