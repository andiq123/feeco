"use client";

import { useEffect, useState } from "react";
import { fetchStatistics, recordVisit, subscribeStatistics, type AppStatistics } from "@/lib/statistics";

const STATISTICS_REFRESH_MS = 20_000;
const VISITOR_ID_STORAGE_KEY = "feeco.visitor.id";

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
    void recordVisit(visitorId());
    const interval = window.setInterval(refresh, STATISTICS_REFRESH_MS);
    const unsubscribe = subscribeStatistics((nextStatistics) => {
      if (active) {
        setStatistics(nextStatistics);
      }
    });

    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  return statistics;
}

function visitorId(): string {
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const next = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}
