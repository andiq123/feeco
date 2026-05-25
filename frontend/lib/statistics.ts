export type AppStatistics = {
  distinctGuests: number;
  parserUses: number;
  updatedAt: string;
};

export async function fetchStatistics(): Promise<AppStatistics | null> {
  try {
    const response = await fetch("/api/statistics", {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as AppStatistics;
  } catch {
    return null;
  }
}

export function subscribeStatistics(onMessage: (statistics: AppStatistics) => void): () => void {
  const streamURL = statisticsStreamURL();
  if (!streamURL) {
    return () => {};
  }

  const socket = new WebSocket(streamURL);
  socket.addEventListener("message", (event) => {
    try {
      onMessage(JSON.parse(event.data) as AppStatistics);
    } catch {
      // Ignore malformed realtime messages and let polling remain the fallback.
    }
  });

  return () => {
    socket.close(1000, "statistics widget unmounted");
  };
}

function statisticsStreamURL(): string {
  const configuredURL = process.env.NEXT_PUBLIC_BACKEND_WS_URL;
  if (!configuredURL) {
    return "";
  }

  try {
    const url = new URL(configuredURL);
    if (url.protocol !== "ws:" && url.protocol !== "wss:") {
      return "";
    }
    url.pathname = "/api/statistics/stream";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}
