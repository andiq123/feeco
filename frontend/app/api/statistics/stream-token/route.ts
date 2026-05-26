import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

const DEFAULT_BACKEND_URL = "http://localhost:8080";
const STREAM_TOKEN_TTL_SECONDS = 60;

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  if (!isAppFetch(request)) {
    return new NextResponse("not found", { status: 404 });
  }

  const apiKey = process.env.BACKEND_API_KEY;
  if (!apiKey) {
    return new NextResponse("statistics stream unavailable", { status: 503 });
  }
  const streamURL = statisticsStreamURL(process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL);
  if (!streamURL) {
    return new NextResponse("statistics stream unavailable", { status: 503 });
  }
  if (isVercelWebSocketURL(streamURL)) {
    return new NextResponse("statistics stream unavailable on vercel backend", { status: 503 });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + STREAM_TOKEN_TTL_SECONDS;
  const payload = Buffer.from(String(expiresAt)).toString("base64url");
  const signature = createHmac("sha256", apiKey).update(payload).digest("hex");

  return NextResponse.json({ streamURL, token: `${payload}.${signature}` });
}

function isAppFetch(request: Request): boolean {
  const mode = request.headers.get("sec-fetch-mode");
  const site = request.headers.get("sec-fetch-site");

  if (mode === "navigate") {
    return false;
  }
  return site === "same-origin" || site === "same-site";
}

function statisticsStreamURL(backendURL: string): string {
  try {
    const url = new URL("/api/statistics/stream", backendURL);
    if (url.protocol === "https:") {
      url.protocol = "wss:";
    } else if (url.protocol === "http:") {
      url.protocol = "ws:";
    } else {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function isVercelWebSocketURL(value: string): boolean {
  try {
    return new URL(value).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}
