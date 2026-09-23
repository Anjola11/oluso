# Oluso Deployment Guide

This guide covers deploying the Oluso Streaming platform:
- **Backend (FastAPI Hub):** Deployed on **Heroku**
- **Frontend (React / Vite):** Deployed on **Vercel**
- **Firmware (ESP32):** Configured to connect to your deployed Heroku backend
- **Codebase:** Pushed to **GitHub**

---

## 1. Preparing the Git Repository & GitHub Push

The repository is configured as a monorepo containing `/backend`, `/frontend`, and `/firmware`.

### Verify Secrets Are Ignored
> [!CAUTION]
> The root `.gitignore` is configured to strictly ignore `**/secrets.h` (containing Wi-Fi passwords) and all `.env` files.
> Always check `git status` before committing to confirm that `secrets.h` is **never** staged!

To initialize and push to GitHub:
```bash
# 1. Initialize git at the repository root
git init
git branch -M main

# 2. Check status (verify secrets.h, .venv, node_modules are NOT listed)
git status

# 3. Add and commit all tracked files
git add .
git commit -m "feat: complete Oluso streaming platform ready for deployment"

# 4. Link your GitHub remote and push
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## 2. Deploying Backend on Heroku

### Process Architecture & Single Dyno Rule
> [!IMPORTANT]
> The Streaming Hub stores connected devices, active viewers, and frame queues **in process memory** (`StreamingHub`).
> Therefore, the backend **must run as exactly one web dyno with one worker process**.
> Do not scale beyond 1 dyno, and do not add `--workers` to Uvicorn. Scaling out would split devices and viewers across separate processes, preventing viewers from receiving camera streams.

### Option A: Heroku Dashboard (GitHub Integration)
1. Go to [Heroku Dashboard](https://dashboard.heroku.com/) and click **New → Create new app** (e.g. `oluso-streaming-api`).
2. Under **Deploy → Deployment method**, select **GitHub**.
3. Connect your GitHub repository (`<your-repo-name>`).
4. In **Settings → Buildpacks**, ensure the **heroku/python** buildpack is present (Heroku detects `requirements.txt` and `Procfile` in the root).
5. In **Settings → Config Vars**, add:
   - `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g. `https://your-frontend.vercel.app` or `*`).
   *(Note: The backend automatically allows local development IPs and all `*.vercel.app` domains out of the box).*
6. Under **Deploy → Manual deploy**, choose branch `main` and click **Deploy Branch**.

### Option B: Heroku CLI
```bash
# Login to Heroku
heroku login

# Create app
heroku create oluso-streaming-api --buildpack heroku/python

# Configure CORS origin
heroku config:set CORS_ORIGINS="https://your-frontend.vercel.app"

# Push to Heroku
git push heroku main
```

### Backend Verification
Verify your backend is alive by visiting in your browser:
`https://<your-heroku-app>.herokuapp.com/health`
Expected response:
```json
{"status": "ok", "service": "streaming-hub"}
```

---

## 3. Deploying Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New... → Project**.
2. Select your imported GitHub repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and choose `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://<your-heroku-app>.herokuapp.com`
   *(Do NOT add a trailing slash. The frontend automatically translates `https://` to `wss://` for WebSocket streaming).*
5. Click **Deploy**.
6. Once deployed, copy your production Vercel URL (e.g. `https://oluso-stream.vercel.app`).
7. (Optional but recommended) In your Heroku app settings, update `CORS_ORIGINS` to match your Vercel URL:
   `https://oluso-stream.vercel.app`

---

## 4. Connecting ESP32 Camera to Deployed Backend

In `firmware/firmware/secrets.h`:
```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Your deployed Heroku hostname (without https:// or wss://)
const char* WS_HOST       = "your-heroku-app.herokuapp.com";
const int   WS_PORT       = 443;
const char* WS_PATH       = "/ws/device/camera-001";
```
Upload the sketch to your ESP32-CAM via Arduino IDE or PlatformIO. The camera will stream directly to your Heroku hub over TLS port 443!
