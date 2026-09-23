# Oluso Streaming Hub Frontend

A dark, high-performance monitoring web console for real-time ESP32 camera streaming via FastAPI WebSocket hub.

---

## 1. Run everything locally

Run the backend from the repository root:
```powershell
# backend (from repo root)
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

In a second terminal, start the frontend:
```powershell
# frontend
cd frontend
npm install
npm run dev -- --host
```

Open `http://localhost:5173` on your computer, or `http://<PC LAN IP>:5173` on a smartphone on the same Wi-Fi network. **No `.env` file or manual URL configuration is needed**; the frontend automatically connects to the backend on port 8000 matching the current hostname.

---

## 2. Windows Firewall Note

For testing from other devices (e.g. smartphone or another computer on your local network), ensure Windows Firewall allows inbound TCP traffic on ports **8000** (backend API and WebSockets) and **5173** (Vite dev server).

In PowerShell (Run as Administrator):
```powershell
New-NetFirewallRule -DisplayName "Oluso Backend 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Oluso Vite 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

---

## 3. Deploy to Vercel

1. Push your repository to GitHub / GitLab.
2. In Vercel, import the repository and configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Environment Variables**:
     - `VITE_API_URL`: `https://<your-heroku-app>.herokuapp.com`
3. Click **Deploy**.
4. On your Heroku backend, update the `CORS_ORIGINS` config variable to your Vercel deployment URL (e.g. `https://your-frontend.vercel.app`).

---

## 4. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Cloud only | Auto-derived from `window.location.hostname:8000` in dev | Full HTTP URL of the backend (e.g. `https://my-app.herokuapp.com`). WebSocket URLs automatically derive as `wss://`. |
| `VITE_DEFAULT_DEVICE_ID` | No | `camera-001` | Initial device ID to select if no `?device=` URL query parameter is present. |
| `VITE_APP_NAME` | No | `Streaming Hub` | Branding title displayed in the header and document title. |
