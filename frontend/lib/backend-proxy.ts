import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { backendURL } from "@/lib/backend-config";

export async function proxyMultipartRequest(request: NextRequest, backendPath: string): Promise<NextResponse> {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const apiKey = process.env.BACKEND_API_KEY;
  const formData = await readMultipartFormData(request);
  if (formData instanceof NextResponse) {
    return formData;
  }
  const headers = new Headers();

  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }

  const response = await fetch(`${backendURL()}${backendPath}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

async function readMultipartFormData(request: NextRequest): Promise<FormData | NextResponse> {
  try {
    return await request.formData();
  } catch {
    return new NextResponse("upload a valid multipart PDF request", { status: 400 });
  }
}
