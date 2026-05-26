import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendURL } from "@/lib/backend-config";

const VISITOR_COOKIE = "feeco_visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  if (!isAppFetch(request)) {
    return new NextResponse("not found", { status: 404 });
  }
  return proxyStatisticsRequest("/api/statistics", "GET", undefined, fallbackStatistics());
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isAppFetch(request)) {
    return new NextResponse("not found", { status: 404 });
  }
  const visitor = await visitorIdentity();
  const response = await proxyStatisticsRequest("/api/statistics/visit", "POST", JSON.stringify({ visitorId: visitor.id }), new NextResponse(null, { status: 204 }));

  if (visitor.shouldSetCookie) {
    response.cookies.set(VISITOR_COOKIE, visitor.id, visitorCookieOptions());
  }

  return response;
}

async function proxyStatisticsRequest(path: string, method: "GET" | "POST", requestBody: string | undefined, fallback: NextResponse): Promise<NextResponse> {
  const apiKey = process.env.BACKEND_API_KEY;
  const headers = new Headers();

  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }

  if (requestBody) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${backendURL()}${path}`, {
      method,
      body: requestBody,
      cache: "no-store",
      headers,
    });
    const responseBody = await response.text();

    if (!response.ok) {
      return fallback;
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return fallback;
  }
}

function fallbackStatistics(): NextResponse {
  return NextResponse.json({
    available: false,
    distinctGuests: 0,
    parserUses: 0,
    updatedAt: "",
  });
}

function isAppFetch(request: Request): boolean {
  const mode = request.headers.get("sec-fetch-mode");
  const site = request.headers.get("sec-fetch-site");

  if (mode === "navigate") {
    return false;
  }
  return site === "same-origin" || site === "same-site";
}

type VisitorIdentity = {
  id: string;
  shouldSetCookie: boolean;
};

async function visitorIdentity(): Promise<VisitorIdentity> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE)?.value;
  if (existing && existing.length >= 16 && existing.length <= 128) {
    return { id: existing, shouldSetCookie: false };
  }

  const next = crypto.randomUUID();
  return { id: next, shouldSetCookie: true };
}

function visitorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VISITOR_COOKIE_MAX_AGE,
    path: "/",
  } as const;
}
