import { NextResponse } from "next/server";

const DEFAULT_BACKEND_URL = "http://localhost:8080";

export const runtime = "nodejs";

export async function GET() {
  const backendURL = process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;
  const apiKey = process.env.BACKEND_API_KEY;
  const headers = new Headers();

  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }

  try {
    const response = await fetch(`${backendURL}/api/statistics`, {
      cache: "no-store",
      headers,
    });
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "statistics unavailable" }, { status: 503 });
  }
}
