package main

import (
	"log/slog"
	"strconv"
)

type config struct {
	APIKey                 string
	AllowedOrigins         map[string]struct{}
	Port                   string
	RateLimitRequests      int
	RateLimitWindowSeconds int
	PostgresURL            string
}

func loadConfig() config {
	return config{
		APIKey:                 env("BACKEND_API_KEY", ""),
		AllowedOrigins:         parseCSVSet(env("CORS_ALLOWED_ORIGINS", "http://localhost:3000")),
		Port:                   env("PORT", "8080"),
		RateLimitRequests:      envInt("RATE_LIMIT_REQUESTS", 60),
		RateLimitWindowSeconds: envInt("RATE_LIMIT_WINDOW_SECONDS", 60),
		PostgresURL:            env("POSTGRES_URL", ""),
	}
}

func envInt(key string, fallback int) int {
	value := env(key, "")
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		slog.Warn("invalid integer environment value", "key", key, "fallback", fallback)
		return fallback
	}
	return parsed
}
