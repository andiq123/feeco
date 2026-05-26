"use client";

import { useEffect, useState } from "react";
import { fetchStatistics, fetchStatisticsStreamToken, recordVisit, type AppStatistics } from "@/lib/statistics";

const STATISTICS_REFRESH_MS = 20_000;
const STATISTICS_STREAM_RETRY_MS = 4_000;
const VISIT_RECORDED_SESSION_KEY = "feeco.statistics.visitRecorded";

export function useStatistics() {
  const [statistics, setStatistics] = useState<AppStatistics | null>(null);

  useEffect(() => {
    let active = true;
    let retryTimeout: number | null = null;
    let socket: WebSocket | null = null;

    async function refresh() {
      const nextStatistics = await fetchStatistics();
      if (active) {
        setStatistics(nextStatistics);
      }
    }

    async function connectStream() {
      try {
        const stream = await fetchStatisticsStreamToken();
        if (!active || !stream) {
          return;
        }

        socket = new WebSocket(stream.streamURL);
        socket.onmessage = (event) => {
          try {
            const nextStatistics = JSON.parse(event.data) as AppStatistics;
            setStatistics(nextStatistics);
          } catch {
            // Ignore malformed optional live updates and keep the polling fallback alive.
          }
        };
        socket.onclose = () => {
          if (active) {
            retryTimeout = window.setTimeout(connectStream, STATISTICS_STREAM_RETRY_MS);
          }
        };
        socket.onerror = () => socket?.close();
      } catch {
        if (active) {
          retryTimeout = window.setTimeout(connectStream, STATISTICS_STREAM_RETRY_MS);
        }
      }
    }

    void refresh();
    void connectStream();
    recordVisitOncePerSession();
    const interval = window.setInterval(refresh, STATISTICS_REFRESH_MS);

    return () => {
      active = false;
      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }
      socket?.close();
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
