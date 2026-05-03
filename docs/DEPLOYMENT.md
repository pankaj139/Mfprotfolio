# Deployment Guide

For the detailed, step-by-step setup walkthrough with every click documented, see:

👉 **[SETUP_GUIDE.md](SETUP_GUIDE.md)**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                             │
│                    pankaj139/Mfprotfolio                             │
│                                                                      │
│  push to main ──▶  GitHub Actions                                   │
│                        │                                             │
│              ┌─────────┴──────────┐                                 │
│              ▼                    ▼                                  │
│     deploy-frontend.yml   deploy-backend.yml                        │
│              │                    │                                  │
│              ▼                    ▼                                  │
│          Vercel               Render                                 │
│    (React SPA / CDN)     (FastAPI + SQLite)                         │
│   https://your-app        https://your-api                           │
│     .vercel.app             .onrender.com                            │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Summary

| Platform | Hosts | Free tier |
|----------|-------|-----------|
| **Vercel** | React frontend (static SPA) | Unlimited personal projects |
| **Render** | FastAPI backend | 750 hrs/month, sleeps after 15 min idle |

## Required GitHub Secrets

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Project Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General |
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Settings → Deploy Hook |
| `VITE_API_URL` | Your Render service URL, e.g. `https://mf-portfolio-api.onrender.com` |

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for exact steps to find each of these values.
