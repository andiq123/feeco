import { NextRequest, NextResponse } from "next/server";

type ClientWindow = {
  count: number;
  lastSeen: number;
  windowStart: number;
};

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_SECONDS = 60;
const windows = new Map<string, ClientWindow>();

export function enforceRateLimit(request: NextRequest): NextResponse | null {
  const limit = positiveEnvInt("RATE_LIMIT_REQUESTS", DEFAULT_LIMIT);
  const windowMs = positiveEnvInt("RATE_LIMIT_WINDOW_SECONDS", DEFAULT_WINDOW_SECONDS) * 1000;
  const now = Date.now();
  const key = clientKey(request);
  const current = windows.get(key);
  const windowState =
    !current || now - current.windowStart >= windowMs
      ? { count: 0, lastSeen: now, windowStart: now }
      : current;

  windowState.count += 1;
  windowState.lastSeen = now;
  windows.set(key, windowState);
  cleanup(now, windowMs);

  if (windowState.count <= limit) {
    return null;
  }

  const retryAfter = Math.max(1, Math.ceil((windowMs - (now - windowState.windowStart)) / 1000));
  return new NextResponse("rate limit exceeded", {
    status: 429,
    headers: {
      "Retry-After": String(retryAfter),
    },
  });
}

function cleanup(now: number, windowMs: number) {
  const cutoff = now - 2 * windowMs;
  for (const [key, value] of windows) {
    if (value.lastSeen < cutoff) {
      windows.delete(key);
    }
  }
}

function clientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function positiveEnvInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
