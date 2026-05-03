# Development Guide

## Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| Python | 3.10 | [python.org](https://python.org) |
| Node.js | 18 | [nodejs.org](https://nodejs.org) |
| npm | 9 | bundled with Node.js |
| Git | any | [git-scm.com](https://git-scm.com) |

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/pankaj139/Mfprotfolio.git
cd Mfprotfolio
```

### 2. Backend setup
```bash
cd backend

# (Recommended) Create a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env template and edit as needed
cp ../.env.example .env

# Start the dev server (auto-reload)
uvicorn main:app --reload --port 8000
```

The backend seeds demo data automatically on first startup:
- 1 demo user (`demo@mfportfolio.com` / `Demo@1234`)
- 5 Indian equity funds with 2 months of holdings + sector data
- 6 pre-configured alerts

Swagger UI: http://localhost:8000/docs

### 3. Frontend setup
```bash
cd frontend

# Install packages
npm install

# Copy env template
cp .env.example .env

# Start the dev server (Vite with proxy to :8000)
npm run dev
```

Frontend: http://localhost:5173

The Vite dev server proxies `/api/*` requests to `http://localhost:8000` automatically (`vite.config.ts`).

---

## Environment Variables

### Backend (`backend/.env`)
```env
# Database connection
# SQLite (default, zero-config for dev)
DATABASE_URL=sqlite:///./mf_portfolio.db
# PostgreSQL (for production)
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT signing key — CHANGE THIS in production
SECRET_KEY=dev-secret-key-change-me

# Token lifetime in minutes (default: 1440 = 24 hours)
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend (`frontend/.env`)
```env
# Backend base URL (leave blank for Vite proxy in dev)
VITE_API_URL=
```

In production set `VITE_API_URL` to your Render backend URL:
```env
VITE_API_URL=https://mf-portfolio-api.onrender.com
```

---

## Project Architecture

```
                  ┌──────────────────────────────┐
                  │        React SPA              │
                  │  (Vite · Tailwind · Recharts) │
                  └──────────────┬───────────────┘
                                 │ HTTP / REST
                                 ▼
                  ┌──────────────────────────────┐
                  │       FastAPI Backend         │
                  │  /api/auth  (public)          │
                  │  /api/*     (JWT protected)   │
                  └──────┬───────────┬────────────┘
                         │           │
              ┌──────────▼─┐   ┌─────▼──────────────┐
              │  SQLite /   │   │  External APIs      │
              │  PostgreSQL │   │  mfapi.in (AMFI)    │
              │  (models)   │   │  Google News RSS    │
              └────────────┘   └────────────────────┘
```

### Authentication Flow
1. User POSTs to `/api/auth/login` with form-encoded `username` + `password`
2. Backend verifies PBKDF2-SHA256 hash and returns a signed HS256 JWT
3. Frontend stores the JWT in `localStorage` and sets `axios.defaults.headers.common["Authorization"]`
4. All subsequent API requests include `Authorization: Bearer <token>`
5. Backend `get_current_user()` dependency decodes + validates the token on every protected route

---

## Code Conventions

### Backend
- One SQLAlchemy model per domain concept in `models.py`
- Pydantic output schemas in `schemas.py`
- Each feature gets its own router in `routers/`
- External integrations live in `services/`
- Static routes (`/all/...`) must appear **before** parameterised routes (`/{id}/...`) in the same router file to avoid FastAPI path conflicts

### Frontend
- All API calls go through `src/services/api.ts` — never call `axios` directly in components
- Pages import `useAuth()` from `AuthContext`; they do **not** check `localStorage` directly
- Types are shared in `src/types/index.ts`
- Use `useQuery` for reads, `useMutation` for writes (TanStack React Query)

---

## Common Tasks

### Add a new alert type
1. Create the alert in the DB via `models.Alert` with the new `alert_type` string
2. Add the label/icon to `ALERT_TYPE_LABELS` and `ALERT_TYPE_ICONS` in `frontend/src/pages/Alerts.tsx`

### Add a new fund manually
Use the portfolio search on the Portfolio page (calls `GET /api/portfolio/search?q=...` which queries mfapi.in).

### Import factsheet data
POST to `/api/holdings/{fund_id}/snapshot` or add rows directly to `holding_snapshots` / `sector_snapshots` tables. A future enhancement would parse Value Research PDF factsheets.

### Reset the demo database
```bash
cd backend
rm mf_portfolio.db
uvicorn main:app --reload   # re-seeds on startup
```

---

## Running Tests

There are no automated tests in this initial version. Recommended approach for adding them:

```bash
pip install pytest pytest-asyncio httpx

# Create backend/tests/test_auth.py etc.
pytest backend/tests/
```

For frontend:
```bash
npm install -D vitest @testing-library/react
# Create frontend/src/__tests__/
npx vitest run
```

---

## Linting & Formatting

```bash
# Backend
pip install ruff
ruff check backend/
ruff format backend/

# Frontend
npx eslint src/
npx prettier --write src/
```
