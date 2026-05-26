export type AppStatistics = {
  available?: boolean;
  distinctGuests: number;
  parserUses: number;
  updatedAt: string;
};

type StatisticsStreamToken = {
  token: string;
};

export async function fetchStatistics(): Promise<AppStatistics | null> {
  try {
    const response = await fetch("/api/statistics", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) {
      return null;
    }
    const statistics = (await response.json()) as AppStatistics;
    return statistics.available === false ? null : statistics;
  } catch {
    return null;
  }
}

export async function recordVisit(): Promise<void> {
  try {
    await fetch("/api/statistics", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    // Statistics are non-critical; the app should continue if unavailable.
  }
}

export async function fetchStatisticsStreamToken(): Promise<string> {
  const response = await fetch("/api/statistics/stream-token", {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error("statistics stream unavailable");
  }
  const body = (await response.json()) as StatisticsStreamToken;
  return body.token;
}

export function statisticsStreamURL(token: string): string {
  const baseURL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || websocketOriginFromLocation();
  const url = new URL("/api/statistics/stream", baseURL);
  url.searchParams.set("token", token);
  return url.toString();
}

function websocketOriginFromLocation(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}
