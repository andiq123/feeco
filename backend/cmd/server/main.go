package main

import (
	"errors"
	"log/slog"
	"net/http"
	"os"
	"time"
)

func main() {
	config := loadConfig()
	if config.APIKey == "" {
		slog.Error("BACKEND_API_KEY is required")
		os.Exit(1)
	}

	statsStore, err := newStatsStore(config.PostgresURL, config.APIKey)
	if err != nil {
		slog.Warn("statistics disabled", "error", err)
	}

	handler := withAPIKey(routes(statsStore), config.APIKey)
	handler = withRateLimit(handler, config.RateLimitRequests, time.Duration(config.RateLimitWindowSeconds)*time.Second)
	handler = withCORS(handler, config.AllowedOrigins)

	server := &http.Server{
		Addr:              ":" + config.Port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	slog.Info("backend listening", "addr", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
