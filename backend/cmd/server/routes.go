package main

import "net/http"

func routes(stats *statsStore) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", health)
	mux.HandleFunc("GET /api/statistics", statisticsHandler(stats))
	mux.HandleFunc("POST /api/statistics/visit", statisticsVisitHandler(stats))
	mux.HandleFunc("GET /api/statistics/stream", statisticsStreamHandler(stats))
	mux.HandleFunc("POST /api/analyze", analyze)
	mux.HandleFunc("POST /api/analyze/batch", analyzeBatch)
	return mux
}

func statisticsVisitHandler(stats *statsStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if stats == nil {
			http.Error(w, "statistics unavailable", http.StatusServiceUnavailable)
			return
		}
		stats.handleStatisticsVisit(w, r)
	}
}

func statisticsStreamHandler(stats *statsStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if stats == nil {
			http.Error(w, "statistics unavailable", http.StatusServiceUnavailable)
			return
		}
		stats.handleStatisticsStream(w, r)
	}
}

func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func statisticsHandler(stats *statsStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if stats == nil {
			http.Error(w, "statistics unavailable", http.StatusServiceUnavailable)
			return
		}
		stats.handleStatistics(w, r)
	}
}
