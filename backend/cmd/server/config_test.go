package main

import "testing"

func TestLoadConfigReadsRateLimitSettings(t *testing.T) {
	t.Setenv("BACKEND_API_KEY", "secret")
	t.Setenv("RATE_LIMIT_REQUESTS", "25")
	t.Setenv("RATE_LIMIT_WINDOW_SECONDS", "120")

	config := loadConfig()

	if config.RateLimitRequests != 25 {
		t.Fatalf("RateLimitRequests = %d, want %d", config.RateLimitRequests, 25)
	}
	if config.RateLimitWindowSeconds != 120 {
		t.Fatalf("RateLimitWindowSeconds = %d, want %d", config.RateLimitWindowSeconds, 120)
	}
}

func TestLoadConfigFallsBackForInvalidRateLimitSettings(t *testing.T) {
	t.Setenv("RATE_LIMIT_REQUESTS", "invalid")
	t.Setenv("RATE_LIMIT_WINDOW_SECONDS", "0")

	config := loadConfig()

	if config.RateLimitRequests != 60 {
		t.Fatalf("RateLimitRequests = %d, want %d", config.RateLimitRequests, 60)
	}
	if config.RateLimitWindowSeconds != 60 {
		t.Fatalf("RateLimitWindowSeconds = %d, want %d", config.RateLimitWindowSeconds, 60)
	}
}
