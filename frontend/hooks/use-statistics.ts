"use client";

import { useEffect, useState } from "react";
import { fetchStatistics, recordVisit, type AppStatistics } from "@/lib/statistics";

const STATISTICS_REFRESH_MS = 20_000;

export function useStatistics() {
  const [statistics, setStatistics] = useState<AppStatistics | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const nextStatistics = await fetchStatistics();
      if (active) {
        setStatistics(nextStatistics);
      }
    }

    void refresh();
    void recordVisit();
    const interval = window.setInterval(refresh, STATISTICS_REFRESH_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return statistics;
}
