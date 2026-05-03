# Complete Setup Guide — Render + Vercel

This guide walks you through every step required to deploy the MF Portfolio Intelligence app on **Render** (backend) and **Vercel** (frontend) — both completely free, no credit card required.

**Time required:** ~30 minutes

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Deploy Backend on Render](#2-deploy-backend-on-render)
   - 2.1 [Create Render account](#21-create-a-render-account)
   - 2.2 [Connect GitHub](#22-connect-github-to-render)
   - 2.3 [Create Web Service](#23-create-the-web-service)
   - 2.4 [Configure build settings](#24-configure-build-settings)
   - 2.5 [Add environment variables](#25-add-environment-variables)
   - 2.6 [Deploy and verify](#26-deploy-and-verify)
   - 2.7 [Copy the deploy hook URL](#27-copy-the-deploy-hook-url)
   - 2.8 [Add free PostgreSQL via Supabase](#28-add-free-postgresql-via-supabase-recommended)
3. [Deploy Frontend on Vercel](#3-deploy-frontend-on-vercel)
   - 3.1 [Create Vercel account](#31-create-a-vercel-account)
   - 3.2 [Import the project](#32-import-the-github-repository)
   - 3.3 [Configure build settings](#33-configure-build-settings)
   - 3.4 [Add environment variables](#34-add-environment-variables)
   - 3.5 [Deploy and verify](#35-deploy-and-verify)
   - 3.6 [Collect Vercel credentials for GitHub Actions](#36-collect-vercel-credentials-for-github-actions)
4. [Configure GitHub Actions CI/CD](#4-configure-github-actions-cicd)
5. [Verify the Full Pipeline](#5-verify-the-full-pipeline)
6. [Custom Domain (Optional)](#6-custom-domain-optional)
7. [Production Hardening](#7-production-hardening)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Before you start, make sure you have:

- [ ] The code pushed to **GitHub** at `pankaj139/Mfprotfolio`
- [ ] A **GitHub** account (free)
- [ ] A browser — that's it

You do **not** need to install anything locally for this deployment guide.

---

## 2. Deploy Backend on Render

### 2.1 Create a Render Account

1. Open [https://render.com](https://render.com) in your browser
2. Click the **Get Started for Free** button (top-right)
3. Select **Continue with GitHub** — this lets Render access your repositories automatically
4. Authorise Render to read your GitHub account
5. You land on the **Render Dashboard**

> Render's free tier gives you 750 compute hours per month — more than enough for one always-on service.

---

### 2.2 Connect GitHub to Render

If this is your first Render service, you may be prompted to install the Render GitHub App:

1. Click **Connect account** or **Configure GitHub App**
2. Choose **Only select repositories**
3. Select `pankaj139/Mfprotfolio` from the list
4. Click **Install & Authorize**

You are redirected back to the Render Dashboard.

---

### 2.3 Create the Web Service

1. On the Render Dashboard, click **New +** (top-right blue button)
2. Select **Web Service** from the dropdown
3. In the **Connect a repository** section, find `pankaj139/Mfprotfolio` and click **Connect**

---

### 2.4 Configure Build Settings

You'll see a form. Fill it in exactly as below:

| Field | Value |
|-------|-------|
| **Name** | `mf-portfolio-api` |
| **Region** | `Singapore (Southeast Asia)` — closest to India |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

Scroll down to **Instance Type** and select **Free**.

> **Important:** Set **Root Directory** to `backend`. Render will `cd backend` before running the build and start commands.

---

### 2.5 Add Environment Variables

Still on the same page, scroll down to the **Environment Variables** section.

Click **Add Environment Variable** for each row:

| Key | Value | Notes |
|-----|-------|-------|
| `SECRET_KEY` | _(generate below)_ | Must be strong and secret |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | 24-hour JWT lifetime |

**Generating a secure SECRET_KEY:**

Option A — run this in your terminal:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Option B — use any online random string generator and produce a 64-character hex string.

Copy the output and paste it as the value for `SECRET_KEY`.

> **Never share or commit your SECRET_KEY.** It signs all JWTs; if leaked, anyone can forge authentication tokens.

Leave `DATABASE_URL` blank for now — the app defaults to SQLite (ephemeral). Follow [section 2.8](#28-add-free-postgresql-via-supabase-recommended) right after your first deploy to wire up free persistent PostgreSQL via Supabase.

---

### 2.6 Deploy and Verify

1. Click **Create Web Service** at the bottom of the page
2. Render begins cloning your repo and running the build — you'll see live build logs
3. The first build takes **3–5 minutes**
4. When the status changes to **Live** (green dot), your backend is running

**Note your service URL** — it appears at the top of the service page:
```
https://mf-portfolio-api.onrender.com
```
(The exact subdomain depends on the name you chose.)

**Verify it works:**

Open a new browser tab and visit:
```
https://mf-portfolio-api.onrender.com/health
```

You should see:
```json
{"status": "ok", "version": "1.0.0"}
```

You can also view the interactive API docs at:
```
https://mf-portfolio-api.onrender.com/docs
```

> **Free tier cold starts:** If the service has been idle for 15 minutes, the first request takes up to 30 seconds to wake it up. Subsequent requests are fast. See [section 8](#8-troubleshooting) to set up a keep-alive ping.

---

### 2.7 Copy the Deploy Hook URL

The deploy hook lets GitHub Actions trigger a new deployment automatically.

1. In your Render service page, click **Settings** (left sidebar or top tab)
2. Scroll down to the **Deploy Hook** section
3. Click **Generate Deploy Hook** if one doesn't exist yet
4. You'll see a URL like:
   ```
   https://api.render.com/deploy/srv-cxxxxxxxxxxxxxxx?key=yyyyyyyyyyyyyyy
   ```
5. Click **Copy** — save this URL, you'll add it to GitHub Secrets in [section 4](#4-configure-github-actions-cicd)

---

### 2.8 Add Free PostgreSQL via Supabase (Recommended)

The free Render tier uses **ephemeral storage** — the SQLite database is wiped every time the service redeploys. Any funds you add manually are lost on the next deploy.

**Render's built-in PostgreSQL add-on is paid.** Use [Supabase](https://supabase.com) instead — it offers a permanently free PostgreSQL database (500 MB, no expiry).

> **Alternative:** [Neon](https://neon.tech) also offers a free serverless PostgreSQL (0.5 GB). The steps are nearly identical — swap the connection string.

#### Step 1 — Create a Supabase account

1. Open [https://supabase.com](https://supabase.com)
2. Click **Start your project**
3. Click **Continue with GitHub** and authorise Supabase
4. You land on the **Supabase Dashboard**

#### Step 2 — Create a new project

1. Click **New project**
2. Choose your **Organisation** (your personal org is fine)
3. Fill in:
   - **Name:** `mf-portfolio-db`
   - **Database Password:** create a strong password and **save it somewhere safe** — you'll need it in step 3
   - **Region:** `Southeast Asia (Singapore)` — matches the Render region
4. Click **Create new project**
5. Wait **~2 minutes** for Supabase to provision the database (you'll see a progress bar)

#### Step 3 — Copy the connection string

1. In your project, click the **Settings** icon (gear ⚙️) in the left sidebar
2. Click **Database** under *Configuration*
3. Scroll down to the **Connection string** section
4. Make sure the **URI** tab is selected
5. You'll see a string like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijkl.supabase.co:5432/postgres
   ```
6. Click **Copy** — then replace `[YOUR-PASSWORD]` with the password you set in Step 2

> **Important:** Use the **direct connection** (port `5432`), not the pooler (port `6543`). SQLAlchemy's built-in connection pool works correctly on port 5432.

#### Step 4 — Add the connection string to Render

1. Go back to your Render Dashboard → **mf-portfolio-api** Web Service
2. Click the **Environment** tab (left sidebar)
3. Find the existing `DATABASE_URL` variable and click **Edit**
4. Replace the SQLite value with your Supabase connection string:
   ```
   postgresql://postgres:your_password@db.xxxx.supabase.co:5432/postgres
   ```
5. Click **Save Changes**
6. Render triggers an automatic redeploy — wait ~2 minutes for it to complete

#### Step 5 — Verify persistence

1. Visit your app and log in with the demo credentials
2. Add a new fund from the Portfolio page
3. Trigger a manual redeploy in Render (Dashboard → service → **Manual Deploy → Deploy latest commit**)
4. After the redeploy completes, log back in — your added fund should still be there

> **Free tier limits:** Supabase free tier includes 500 MB storage and 2 free projects. No expiry, no credit card required.

---

## 3. Deploy Frontend on Vercel

### 3.1 Create a Vercel Account

1. Open [https://vercel.com](https://vercel.com)
2. Click **Start Deploying** or **Sign Up**
3. Select **Continue with GitHub**
4. Authorise Vercel to access your GitHub account
5. You land on the **Vercel Dashboard**

---

### 3.2 Import the GitHub Repository

1. On the Vercel Dashboard, click **Add New… → Project** (top-right)
2. In the **Import Git Repository** section, you'll see your GitHub repos listed
3. Find `pankaj139/Mfprotfolio` and click **Import**

If you don't see the repo, click **Adjust GitHub App Permissions** and grant Vercel access to `Mfprotfolio`.

---

### 3.3 Configure Build Settings

After clicking **Import**, Vercel shows a configuration screen:

**1. Set the Root Directory**

Click **Edit** next to Root Directory and type:
```
frontend
```
Click **Continue**.

> This tells Vercel to build from the `frontend/` folder, not the repo root.

**2. Framework Preset**

Vercel should auto-detect **Vite**. If it doesn't, select **Vite** from the dropdown.

**3. Build & Output Settings** (these should be auto-filled correctly):

| Setting | Value |
|---------|-------|
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

Do **not** click Deploy yet — first add the environment variable.

---

### 3.4 Add Environment Variables

Still on the configuration screen, expand the **Environment Variables** section.

Click **Add** and enter:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://mf-portfolio-api.onrender.com` |

Replace `mf-portfolio-api` with the actual subdomain Render assigned your service.

> This tells the React app where the backend lives. Without it, API calls would go to the same domain as the frontend and fail.

Now click **Deploy**.

---

### 3.5 Deploy and Verify

1. Vercel clones the repo, installs npm packages, and runs `npm run build`
2. The first build takes **1–2 minutes**
3. When complete, you'll see **"Congratulations!"** with a deployment URL like:
   ```
   https://mfprotfolio.vercel.app
   ```
4. Click **Visit** to open the app

**You should see the Login page** with demo credentials pre-filled:
```
Email:    demo@mfportfolio.com
Password: Demo@1234
```

Click **Sign in** — you should be redirected to the Dashboard showing 5 funds and 5 alerts.

> **If you see a blank page or API errors:** Check that `VITE_API_URL` is correct and the Render backend is live. The Render free tier may be sleeping — try hitting the `/health` URL directly first to wake it up.

---

### 3.6 Collect Vercel Credentials for GitHub Actions

You need three values to allow GitHub Actions to deploy to Vercel automatically.

#### Get VERCEL_TOKEN

1. Click your **avatar** (top-right on Vercel) → **Account Settings**
2. Select **Tokens** in the left sidebar
3. Click **Create Token**
4. Name it `github-actions-mfportfolio`
5. Set **Scope** to **Full Account**
6. Set **Expiration** to **No Expiration** (or 1 year)
7. Click **Create Token**
8. **Copy the token immediately** — it is shown only once

#### Get VERCEL_ORG_ID

1. In Vercel, click your **avatar → Account Settings → General**
2. Scroll down to find **Your ID** — this is your `VERCEL_ORG_ID`
3. Copy it (format: `team_xxxxxxxxxxxxxxxxxxxxxxxx` or `usr_xxxxxxxxxxxxxxxxxxxxxxxx`)

Alternatively, run in your terminal (with Vercel CLI installed):
```bash
npx vercel whoami --json
```

#### Get VERCEL_PROJECT_ID

1. In Vercel, click on the **mfprotfolio** project to open it
2. Click **Settings** (top tab)
3. Under **General**, scroll to **Project ID**
4. Copy the value (format: `prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

Save all three values — you'll enter them as GitHub Secrets next.

---

## 4. Configure GitHub Actions CI/CD

GitHub Actions will automatically:
- Run TypeScript checks on the frontend
- Deploy the frontend to Vercel
- Lint the backend and trigger a Render redeploy

...every time you push to the `main` branch.

### 4.1 Open GitHub Secrets

1. Go to `https://github.com/pankaj139/Mfprotfolio`
2. Click **Settings** (top tab — you need to be the repo owner)
3. In the left sidebar, click **Secrets and variables → Actions**
4. You'll see a **Repository secrets** section

### 4.2 Add Each Secret

Click **New repository secret** and add all five secrets one by one:

| Secret Name | Value | Where to get it |
|-------------|-------|----------------|
| `VERCEL_TOKEN` | The token you created in step 3.6 | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | Your Vercel user/org ID | Vercel → Account Settings → General → Your ID |
| `VERCEL_PROJECT_ID` | Your project ID | Vercel → Project → Settings → General → Project ID |
| `RENDER_DEPLOY_HOOK_URL` | The hook URL from step 2.7 | Render → Service → Settings → Deploy Hook |
| `VITE_API_URL` | `https://mf-portfolio-api.onrender.com` | Your Render service URL |

For each secret:
1. Click **New repository secret**
2. Enter the **Name** exactly as shown (case-sensitive)
3. Paste the **Value**
4. Click **Add secret**

After all five are added, the secrets list should show:

```
RENDER_DEPLOY_HOOK_URL   Updated just now
VERCEL_ORG_ID            Updated just now
VERCEL_PROJECT_ID        Updated just now
VERCEL_TOKEN             Updated just now
VITE_API_URL             Updated just now
```

### 4.3 Trigger the First Automated Deploy

Make a small change and push to main to test the pipeline:

```bash
git checkout main
git pull origin main

# Make a trivial change, e.g. update README
echo "" >> README.md
git add README.md
git commit -m "ci: trigger first automated deploy"
git push origin main
```

### 4.4 Watch the GitHub Actions Run

1. Go to your repo on GitHub
2. Click the **Actions** tab
3. You should see two workflows running:
   - **Deploy Frontend to Vercel**
   - **Deploy Backend to Render**
4. Click on a workflow to see live step-by-step logs

Both should show a green ✅ when complete.

---

## 5. Verify the Full Pipeline

After both workflows succeed, run a full end-to-end check:

### 5.1 Check the backend is alive
```bash
curl https://mf-portfolio-api.onrender.com/health
```
Expected response:
```json
{"status": "ok", "version": "1.0.0"}
```

### 5.2 Test the login API
```bash
curl -s -X POST https://mf-portfolio-api.onrender.com/api/auth/login \
  -F "username=demo@mfportfolio.com" \
  -F "password=Demo@1234" | python3 -m json.tool
```
Expected: a JSON response with `access_token`.

### 5.3 Open the frontend
Visit your Vercel URL (e.g. `https://mfprotfolio.vercel.app`).

- Login with `demo@mfportfolio.com` / `Demo@1234`
- You should see the Dashboard with 5 funds, 5 alerts
- Navigate to **Holdings Tracker** — select a fund and verify NEW BUY / FULL EXIT rows appear
- Navigate to **News Feed** — articles should load

### 5.4 Confirm CI/CD works end-to-end

Make a visible change, push to `main`, wait for GitHub Actions, and confirm the change appears in the deployed app.

---

## 6. Custom Domain (Optional)

### Vercel — add a custom domain

1. In your Vercel project, go to **Settings → Domains**
2. Click **Add Domain**
3. Enter your domain, e.g. `app.mfportfolio.in`
4. Vercel shows you DNS records to add (usually a CNAME or A record)
5. Log in to your domain registrar (GoDaddy, Namecheap, Google Domains, etc.)
6. Add the DNS record Vercel specified
7. Wait for DNS propagation (up to 24 hours; usually under 30 minutes)
8. Vercel automatically provisions an SSL certificate via Let's Encrypt

### Render — add a custom domain

1. In your Render service, go to **Settings → Custom Domains**
2. Click **Add Custom Domain**
3. Enter your API domain, e.g. `api.mfportfolio.in`
4. Render provides a CNAME target — add it in your DNS registrar
5. Once the domain is live, update `VITE_API_URL` in Vercel environment variables:
   - Go to Vercel → Project → Settings → Environment Variables
   - Edit `VITE_API_URL` to `https://api.mfportfolio.in`
   - Click **Save**
   - Redeploy the frontend (Vercel → Deployments → Redeploy)

---

## 7. Production Hardening

Complete these steps before sharing the app publicly:

### 7.1 Restrict CORS to your frontend domain

Edit `backend/main.py` and replace the wildcard CORS origin:

```python
# Replace this:
allow_origins=["*"],

# With this:
allow_origins=[
    "https://mfportfolio.vercel.app",
    "https://app.mfportfolio.in",       # if you added a custom domain
],
```

Commit and push — Render will redeploy automatically.

### 7.2 Use Supabase PostgreSQL instead of SQLite

Follow [section 2.8](#28-add-free-postgresql-via-supabase-recommended) to connect a free Supabase PostgreSQL instance. Without this, the demo portfolio data is re-seeded fresh on every deploy (any funds you manually added are wiped).

### 7.3 Keep the Render backend awake (free tier fix)

The free Render tier sleeps after 15 minutes of inactivity. To prevent this:

1. Sign up for a free account at [https://uptimerobot.com](https://uptimerobot.com)
2. Click **Add New Monitor**
3. Set:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `MF Portfolio API`
   - **URL:** `https://mf-portfolio-api.onrender.com/health`
   - **Monitoring Interval:** Every 5 minutes
4. Click **Create Monitor**

UptimeRobot will now ping your backend every 5 minutes, preventing it from sleeping.

### 7.4 Production Checklist

- [ ] `SECRET_KEY` is a random 64-character hex string (not the default)
- [ ] `DATABASE_URL` points to a Supabase PostgreSQL instance
- [ ] CORS `allow_origins` restricted to your Vercel domain
- [ ] `VITE_API_URL` set correctly in Vercel environment variables
- [ ] All 5 GitHub Secrets configured
- [ ] UptimeRobot keep-alive monitor active
- [ ] Custom domain DNS propagated (if applicable)

---

## 8. Troubleshooting

### "Application Error" on the Render service URL

**Check the logs:**
1. Render Dashboard → your service → **Logs** tab
2. Look for Python tracebacks or import errors

**Common causes:**

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError` | A package in `requirements.txt` failed to install — check the build logs |
| `Address already in use` | Start command port conflict — ensure the command uses `$PORT` |
| Database connection error | `DATABASE_URL` is wrong or PostgreSQL instance isn't ready yet |

---

### Vercel build fails with "Cannot find module"

1. Go to Vercel → Deployments → click the failed deployment → **Build Logs**
2. Look for the missing module name

**Common fixes:**
- Ensure `Root Directory` is set to `frontend` in Vercel project settings
- Run `npm install` locally in `frontend/` and commit the updated `package-lock.json`

---

### API calls fail from the frontend (CORS or 404)

**Symptoms:** Network errors in browser DevTools, or empty data on pages

**Check 1 — VITE_API_URL is set:**
1. Vercel → Project → Settings → Environment Variables
2. Confirm `VITE_API_URL` = `https://mf-portfolio-api.onrender.com` (no trailing slash)

**Check 2 — Render backend is awake:**
Visit `https://mf-portfolio-api.onrender.com/health` directly in your browser. If it times out, the service is sleeping — wait 30 seconds and retry.

**Check 3 — CORS:**
If you restricted CORS to specific origins, ensure the Vercel domain is in the `allow_origins` list in `backend/main.py`.

---

### GitHub Actions workflow failing

**"Input required and not supplied: vercel-token"**
→ The `VERCEL_TOKEN` secret is missing or misnamed. Go to GitHub → Settings → Secrets → Actions and verify the exact name.

**"Render deploy hook returned HTTP 401"**
→ The `RENDER_DEPLOY_HOOK_URL` is incorrect or expired. Regenerate it in Render → Settings → Deploy Hook.

**"tsc: error TS..."**
→ TypeScript type errors in the frontend code. Run `npx tsc --noEmit` locally in `frontend/` to see the errors, fix them, commit, and push again.

---

### Login returns 401 "Incorrect email or password"

The demo user is seeded when the backend starts for the first time. If you're using SQLite and the database was wiped (e.g. after a Render redeploy):

1. Wait ~30 seconds after the service restarts for the seed to complete
2. Try logging in again — the demo user is re-created on every fresh start

If using Supabase PostgreSQL (see [section 2.8](#28-add-free-postgresql-via-supabase-recommended)), the user persists across deploys and this issue won't occur.

---

### Render free tier database wiped after redeploy

This is expected behaviour on the free tier with SQLite (ephemeral disk). The seed data (demo user + 5 funds) is re-created automatically, but any funds you manually added will be gone.

**Solution:** Follow [section 2.8](#28-add-free-postgresql-via-supabase-recommended) to connect a free Supabase PostgreSQL database and set `DATABASE_URL` in Render — data will then persist across all redeploys.

---

## Summary of All URLs

After successful deployment, bookmark these:

| Resource | URL |
|---------|-----|
| Live app | `https://mfportfolio.vercel.app` |
| Backend API | `https://mf-portfolio-api.onrender.com` |
| API docs (Swagger) | `https://mf-portfolio-api.onrender.com/docs` |
| Health check | `https://mf-portfolio-api.onrender.com/health` |
| Render Dashboard | `https://dashboard.render.com` |
| Vercel Dashboard | `https://vercel.com/dashboard` |
| GitHub Actions | `https://github.com/pankaj139/Mfprotfolio/actions` |
