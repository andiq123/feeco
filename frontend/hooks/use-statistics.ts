"use client";

import { useEffect, useState } from "react";
import { fetchStatistics, recordVisit, type AppStatistics } from "@/lib/statistics";

const STATISTICS_REFRESH_MS = 10_000;
const VISIT_RECORDED_SESSION_KEY = "feeco.statistics.visitRecorded";

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
    recordVisitOncePerSession();
    const interval = window.setInterval(refresh, STATISTICS_REFRESH_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return statistics;
}

function recordVisitOncePerSession() {
  try {
    if (window.sessionStorage.getItem(VISIT_RECORDED_SESSION_KEY)) {
      return;
    }
    window.sessionStorage.setItem(VISIT_RECORDED_SESSION_KEY, "true");
  } catch {
    // If session storage is unavailable, the backend visitor cookie still deduplicates visits.
  }

  void recordVisit();
}
