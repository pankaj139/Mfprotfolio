# MF Portfolio Intelligence

> A comprehensive **Mutual Fund Portfolio Monitoring & Intelligence Platform** for the informed Indian investor — track holdings, sector shifts, performance, alerts, and news across your entire fund portfolio in one dashboard.

---

## Features

### Portfolio Monitoring
| # | Feature | What it does |
|---|---------|-------------|
| 1 | **Holdings Change Tracker** | Stock-level MoM diff from factsheet snapshots. Flags **NEW BUY**, **FULL EXIT**, weight increases/decreases with actual percentages. |
| 2 | **Sector Weight Tracker** | MoM sector allocation comparison with configurable ±threshold (1/2/3/5%). Colour-coded interactive bar chart + ranked table. |
| 3 | **Performance Dashboard** | CAGR for 1Y / 3Y / 5Y / since-inception vs benchmark index and category average. Live NAV chart via AMFI mfapi.in. |
| 4 | **Benchmark History** | 5Y / 10Y / 15Y pass/fail with fund CAGR, benchmark CAGR, and alpha differential per period. |

### Alert & Flag System
| Alert | Trigger |
|-------|---------|
| Fund Manager Change | Any change in the fund manager(s) |
| Category Reclassification | SEBI category change |
| Fund Objective Change | Amended investment objective |
| Fund Name Change | Announced or executed name change |
| Asset Allocation Change | Equity/debt/cash mix shift beyond threshold |
| Sector Reallocation | Sector weight change beyond threshold |
| Holdings Change | Significant new buys or full exits |

### News & Intelligence
- **Per-fund news feed** via Google News RSS — AMC announcements, regulatory actions, fund manager interviews
- **Aggregated portfolio feed** with deduplication
- Curated fallback articles when RSS is unreachable

### Authentication
- JWT-based login & registration (HS256, PBKDF2-SHA256 passwords — stdlib only, zero crypto deps)
- Demo account pre-loaded with 5 popular Indian equity funds
- All data routes are fully protected behind auth

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · Recharts · TanStack React Query |
| Backend | FastAPI · SQLAlchemy · SQLite (dev) / PostgreSQL (prod) |
| Auth | Custom HS256 JWT · PBKDF2-SHA256 password hashing (Python stdlib) |
| Data | AMFI mfapi.in (live NAV) · Google News RSS · Value Research factsheet snapshots |
| Deployment | Vercel (frontend) · Render (backend) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
Mfprotfolio/
├── backend/
│   ├── main.py                 App factory, lifespan seeding, route registration
│   ├── auth.py                 JWT + PBKDF2 utilities (stdlib only)
│   ├── database.py             SQLAlchemy engine, session, env-based URL
│   ├── models.py               User, Fund, HoldingSnapshot, SectorSnapshot, Alert, FundMetadata
│   ├── schemas.py              Pydantic I/O schemas
│   ├── routers/                auth, portfolio, holdings, sectors, performance, alerts, news, dashboard
│   └── services/               amfi_service, news_service, seed_service
│
├── frontend/
│   └── src/
│       ├── App.tsx             Router + AuthProvider + ProtectedLayout
│       ├── contexts/AuthContext.tsx
│       ├── pages/              Login, Register, Dashboard, Portfolio, HoldingsTracker,
│       │                       SectorTracker, Performance, BenchmarkHistory, Alerts, News
│       ├── components/Layout/  Sidebar + Header
│       ├── services/api.ts
│       └── types/index.ts
│
├── .github/workflows/
│   ├── deploy-frontend.yml     Auto-deploy to Vercel on push to main
│   └── deploy-backend.yml      Auto-deploy to Render on push to main
├── docker-compose.yml
├── render.yaml
├── start.sh
└── docs/
    ├── DEVELOPMENT.md
    └── DEPLOYMENT.md
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### One-command start
```bash
git clone https://github.com/pankaj139/Mfprotfolio.git
cd Mfprotfolio
chmod +x start.sh && ./start.sh
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

### Demo credentials
```
Email:    demo@mfportfolio.com
Password: Demo@1234
```

### Manual start
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install && npm run dev
```

### Docker Compose
```bash
docker-compose up --build
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=sqlite:///./mf_portfolio.db
SECRET_KEY=your-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## API Overview

All data endpoints require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/portfolio/` | List portfolio funds |
| GET | `/api/holdings/{id}/compare` | Holdings MoM diff |
| GET | `/api/sectors/{id}/compare` | Sector MoM diff |
| GET | `/api/performance/all/returns` | CAGR returns for all funds |
| GET | `/api/performance/{id}/nav-history` | Live NAV history |
| GET | `/api/performance/all/benchmark-history` | Benchmark pass/fail |
| GET | `/api/alerts/` | All alerts |
| GET | `/api/news/` | Aggregated news feed |
| GET | `/api/dashboard/summary` | Dashboard summary |

Full interactive docs at `/docs` (Swagger UI).

---

## Deployment

See **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** for the complete, click-by-click setup guide covering:
- **Render** backend deployment (Web Service + optional PostgreSQL)
- **Vercel** frontend deployment
- **GitHub Actions** CI/CD secrets configuration
- Troubleshooting, custom domains, and production hardening

Architecture overview and quick reference in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

---

## Development Guide

See **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** for local setup, code structure, and contribution guide.

---

## License

MIT
