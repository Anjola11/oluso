const explicit = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, "");

function resolveApiUrl(): string | null {
  if (explicit) return explicit; // deployed (Vercel) or manual override
  if (import.meta.env.DEV) { // vite dev server
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return null; // production build with no backend configured
}

export const API_URL = resolveApiUrl();
export const WS_URL = API_URL ? API_URL.replace(/^http/, "ws") : null; // http->ws, https->wss
export const DEFAULT_DEVICE_ID = import.meta.env.VITE_DEFAULT_DEVICE_ID ?? "camera-001";
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Streaming Hub";
export const APP_VERSION = "0.1.0";

export const isLocalBackend = API_URL
  ? /^(https?:\/\/)(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(API_URL)
  : false;

export const envLabel = isLocalBackend ? "Local" : "Cloud";

/**
 * Checks for frontend configuration problems:
 * 1. Missing VITE_API_URL in production build
 * 2. Mixed content: page loaded over HTTPS while API_URL is HTTP (non-local)
 */
export function checkConfigError(): { type: 'missing_api' | 'mixed_content'; message: string } | null {
  if (!API_URL) {
    return {
      type: 'missing_api',
      message:
        'No backend URL configured. In production, set the VITE_API_URL environment variable to your deployed backend (e.g. https://your-app.herokuapp.com).',
    };
  }

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    API_URL.startsWith('http:') &&
    !isLocalBackend
  ) {
    return {
      type: 'mixed_content',
      message:
        'Mixed content blocked: This dashboard is served over HTTPS, but API_URL is using unencrypted HTTP. Update VITE_API_URL to use https://.',
    };
  }

  return null;
}
