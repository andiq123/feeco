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
