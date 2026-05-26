export type AppStatistics = {
  available?: boolean;
  distinctGuests: number;
  parserUses: number;
  updatedAt: string;
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
