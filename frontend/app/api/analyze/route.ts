import { NextRequest } from "next/server";
import { proxyMultipartRequest } from "@/lib/backend-proxy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return proxyMultipartRequest(request, "/api/analyze");
}
