import type { NextConfig } from "next";

const connectSources = [
  "'self'",
  "https://vitals.vercel-insights.com",
  "https://vercel.live",
  ...websocketConnectSources(process.env.NEXT_PUBLIC_BACKEND_WS_URL),
].join(" ");

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
  "https://vercel.live",
].join(" ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src ${connectSources}`,
      "frame-src https://vercel.live",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

function websocketConnectSources(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const url = new URL(value);
    return url.protocol === "wss:" || url.protocol === "ws:" ? [url.origin] : [];
  } catch {
    return [];
  }
}

export default nextConfig;
