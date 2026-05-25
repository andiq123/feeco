import { NextResponse } from "next/server";

const DEFAULT_BACKEND_URL = "http://localhost:8080";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  return proxyStatisticsRequest("/api/statistics", "GET");
}

export async function POST(request: Request): Promise<NextResponse> {
  return proxyStatisticsRequest("/api/statistics/visit", "POST", await request.text());
}

async function proxyStatisticsRequest(path: string, method: "GET" | "POST", requestBody?: string): Promise<NextResponse> {
  const backendURL = process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;
  const apiKey = process.env.BACKEND_API_KEY;
  const headers = new Headers();

  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }

  if (requestBody) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${backendURL}${path}`, {
      method,
      body: requestBody,
      cache: "no-store",
      headers,
    });
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "statistics unavailable" }, { status: 503 });
  }
}
