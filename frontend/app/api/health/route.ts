import { NextResponse } from "next/server";
import { backendURL } from "@/lib/backend-config";

const HEALTH_TIMEOUT_MS = 2500;

export const runtime = "nodejs";

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${backendURL()}/healthz`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json({ status: "offline" }, { status: 503 });
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "offline" }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
