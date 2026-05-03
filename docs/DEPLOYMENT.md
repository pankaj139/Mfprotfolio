# Deployment Guide

This guide covers deploying the application for **free** using:
- **Vercel** — React/Vite frontend
- **Render** — FastAPI backend (free tier)
- **GitHub Actions** — automated CI/CD on every push to `main`

---

## Architecture

```
GitHub (main branch)
    │
    ├── GitHub Actions ──▶ Vercel       (frontend SPA)
    │                       └── https://your-app.vercel.app
    │
    └── GitHub Actions ──▶ Render       (FastAPI + SQLite)
                            └── https://your-api.onrender.com
```

---

## Step 1 — Deploy the Backend on Render

### 1.1 Create a Render account
Sign up at [render.com](https://render.com) (free — no credit card needed).

### 1.2 Create a new Web Service

1. Click **New → Web Service**
2. Connect your GitHub repository `pankaj139/Mfprotfolio`
3. Fill in the settings:

| Setting | Value |
|---------|-------|
| **Name** | `mf-portfolio-api` |
| **Region** | Singapore (closest to India) |
| **Branch** | `main` |
| **Root directory** | `backend` |
| **Runtime** | Python 3 |
| **Build command** | `pip install -r requirements.txt` |
| **Start command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance type** | Free |

### 1.3 Set Environment Variables on Render

In the **Environment** tab, add:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | A long random string, e.g. run `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
| `DATABASE_URL` | Leave blank to use SQLite (default), or add a Render PostgreSQL URL |

> **Note:** The free Render tier uses ephemeral storage — the SQLite database is wiped on each deploy. For persistent data, add a **Render PostgreSQL** instance (also has a free tier) and set `DATABASE_URL` to the provided connection string.

### 1.4 Get the Render Deploy Hook URL

1. Go to your Web Service → **Settings** → **Deploy Hook**
2. Copy the URL (looks like `https://api.render.com/deploy/srv-xxxxx?key=yyy`)
3. Save it — you'll need it for GitHub Actions

### 1.5 Note your backend URL

Once deployed, your API will be at something like:
```
https://mf-portfolio-api.onrender.com
```
Note this URL for the frontend configuration.

---

## Step 2 — Deploy the Frontend on Vercel

### 2.1 Create a Vercel account
Sign up at [vercel.com](https://vercel.com) using GitHub login (free).

### 2.2 Import the repository

1. Click **Add New → Project**
2. Select `pankaj139/Mfprotfolio` from the list
3. Vercel detects the `vercel.json` in `frontend/` — configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root directory** | `frontend` |
| **Build command** | `npm run build` |
| **Output directory** | `dist` |

### 2.3 Set Environment Variables on Vercel

In **Settings → Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://mf-portfolio-api.onrender.com` (your Render URL) |

### 2.4 Get Vercel tokens for GitHub Actions

You need three values for GitHub Actions:

1. **VERCEL_TOKEN** — Go to [vercel.com/account/tokens](https://vercel.com/account/tokens) → **Create Token**
2. **VERCEL_ORG_ID** — Run `npx vercel whoami --json` or find in Vercel project settings
3. **VERCEL_PROJECT_ID** — In Vercel project → **Settings → General** → Project ID

---

## Step 3 — Configure GitHub Actions Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|-------------|-------|
| `VERCEL_TOKEN` | From Vercel account tokens |
| `VERCEL_ORG_ID` | Your Vercel org/team ID |
| `VERCEL_PROJECT_ID` | Your Vercel project ID |
| `RENDER_DEPLOY_HOOK_URL` | Deploy hook URL from Render |
| `VITE_API_URL` | `https://mf-portfolio-api.onrender.com` |

---

## Step 4 — Push to main to trigger deployment

```bash
git push origin main
```

GitHub Actions will:
1. Build and run TypeScript checks on the frontend
2. Deploy the frontend build to Vercel (production)
3. Trigger a Render deploy for the backend

Check the **Actions** tab in GitHub to monitor progress.

---

## Verifying the Deployment

### Backend health check
```bash
curl https://mf-portfolio-api.onrender.com/health
# {"status":"ok","version":"1.0.0"}
```

### Frontend
Visit your Vercel URL (e.g. `https://mf-portfolio.vercel.app`).

Login with the demo credentials:
```
Email:    demo@mfportfolio.com
Password: Demo@1234
```

---

## Custom Domain (optional)

### Vercel
1. Go to your Vercel project → **Settings → Domains**
2. Add your domain (e.g. `app.mfportfolio.in`)
3. Update DNS with the provided CNAME record

### Render
1. Go to your Web Service → **Settings → Custom Domains**
2. Add your API domain (e.g. `api.mfportfolio.in`)
3. Update `VITE_API_URL` in Vercel environment variables to the new domain

---

## Production Checklist

- [ ] `SECRET_KEY` is a strong random string (≥32 chars), not the default
- [ ] `DATABASE_URL` points to a persistent PostgreSQL instance (not SQLite)
- [ ] `VITE_API_URL` in Vercel points to the correct backend URL
- [ ] CORS is restricted to your frontend domain in `backend/main.py`
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` is set appropriately
- [ ] GitHub Secrets are all configured

### Restrict CORS for production

Update `backend/main.py` to allow only your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",
        "https://app.yourdomain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Render Free Tier Limitations

| Limitation | Detail |
|-----------|--------|
| Sleep after inactivity | Free services sleep after 15 min of inactivity; first request after wake takes ~30s |
| Storage | Ephemeral — use PostgreSQL for persistent data |
| Bandwidth | 100 GB/month |
| Build minutes | 500 min/month |

To avoid cold starts, you can use [UptimeRobot](https://uptimerobot.com) (free) to ping the `/health` endpoint every 5 minutes.

---

## Alternative: Firebase Hosting (Frontend only)

If you prefer Firebase over Vercel for the frontend:

```bash
npm install -g firebase-tools
cd frontend
npm run build
firebase login
firebase init hosting    # set public dir to "dist", SPA = yes
firebase deploy
```

Set up `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }]
      }
    ]
  }
}
```

The backend still needs to be hosted separately (Render, Railway, Fly.io, etc.).
