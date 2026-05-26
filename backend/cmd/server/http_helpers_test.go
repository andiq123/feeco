package main

import (
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"
	"time"
)

func TestWithAPIKeyRequiresConfiguredKey(t *testing.T) {
	handler := withAPIKey(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), "secret")

	request := httptest.NewRequest(http.MethodPost, "/api/analyze", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("response code = %d, want %d", response.Code, http.StatusUnauthorized)
	}
}

func TestWithAPIKeyAllowsMatchingKey(t *testing.T) {
	handler := withAPIKey(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), "secret")

	request := httptest.NewRequest(http.MethodPost, "/api/analyze", nil)
	request.Header.Set(apiKeyHeader, "secret")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("response code = %d, want %d", response.Code, http.StatusOK)
	}
}

func TestWithAPIKeySkipsHealth(t *testing.T) {
	handler := withAPIKey(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), "secret")

	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("response code = %d, want %d", response.Code, http.StatusOK)
	}
}

func TestWithAPIKeyProtectsStatisticsStream(t *testing.T) {
	handler := withAPIKey(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), "secret")

	request := httptest.NewRequest(http.MethodGet, "/api/statistics/stream", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("response code = %d, want %d", response.Code, http.StatusUnauthorized)
	}
}

func TestWithAPIKeyAllowsSignedStatisticsStreamToken(t *testing.T) {
	handler := withAPIKey(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), "secret")
	expiresAt := time.Now().Add(30 * time.Second).Unix()
	payload := base64.RawURLEncoding.EncodeToString([]byte(strconv.FormatInt(expiresAt, 10)))
	token := payload + "." + statisticsStreamSignature(payload, "secret")

	request := httptest.NewRequest(http.MethodGet, "/api/statistics/stream?token="+url.QueryEscape(token), nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("response code = %d, want %d", response.Code, http.StatusOK)
	}
}

func TestWithSecurityHeadersAddsDefensiveHeaders(t *testing.T) {
	handler := withSecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	request := httptest.NewRequest(http.MethodGet, "/api/statistics", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if value := response.Header().Get("X-Content-Type-Options"); value != "nosniff" {
		t.Fatalf("X-Content-Type-Options = %q, want nosniff", value)
	}
	if value := response.Header().Get("X-Frame-Options"); value != "DENY" {
		t.Fatalf("X-Frame-Options = %q, want DENY", value)
	}
	if value := response.Header().Get("Referrer-Policy"); value != "no-referrer" {
		t.Fatalf("Referrer-Policy = %q, want no-referrer", value)
	}
}

func TestWithCORSAllowsConfiguredOrigin(t *testing.T) {
	handler := withCORS(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), parseCSVSet("http://localhost:3000,http://127.0.0.1:3000"))

	request := httptest.NewRequest(http.MethodOptions, "/api/analyze", nil)
	request.Header.Set("Origin", "http://127.0.0.1:3000")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("response code = %d, want %d", response.Code, http.StatusNoContent)
	}
	if origin := response.Header().Get("Access-Control-Allow-Origin"); origin != "http://127.0.0.1:3000" {
		t.Fatalf("allowed origin = %q, want %q", origin, "http://127.0.0.1:3000")
	}
}

func TestWithCORSRejectsUnknownOrigin(t *testing.T) {
	handler := withCORS(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), parseCSVSet("http://localhost:3000"))

	request := httptest.NewRequest(http.MethodOptions, "/api/analyze", nil)
	request.Header.Set("Origin", "https://example.com")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if origin := response.Header().Get("Access-Control-Allow-Origin"); origin != "" {
		t.Fatalf("allowed origin = %q, want empty", origin)
	}
}

func TestRateLimitRejectsRequestsAfterLimit(t *testing.T) {
	now := time.Date(2026, 5, 25, 12, 0, 0, 0, time.UTC)
	handler := newRateLimiter(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), 2, time.Minute, func() time.Time {
		return now
	})

	for i := 0; i < 2; i++ {
		request := httptest.NewRequest(http.MethodPost, "/api/analyze", nil)
		request.RemoteAddr = "192.0.2.10:1234"
		response := httptest.NewRecorder()

		handler.ServeHTTP(response, request)

		if response.Code != http.StatusOK {
			t.Fatalf("response code = %d, want %d", response.Code, http.StatusOK)
		}
	}

	request := httptest.NewRequest(http.MethodPost, "/api/analyze", nil)
	request.RemoteAddr = "192.0.2.10:1234"
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusTooManyRequests {
		t.Fatalf("response code = %d, want %d", response.Code, http.StatusTooManyRequests)
	}
	if retryAfter := response.Header().Get("Retry-After"); retryAfter == "" {
		t.Fatal("Retry-After header is empty")
	}
}

func TestRateLimitResetsAfterWindow(t *testing.T) {
	now := time.Date(2026, 5, 25, 12, 0, 0, 0, time.UTC)
	handler := newRateLimiter(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), 1, time.Minute, func() time.Time {
		return now
	})

	first := httptest.NewRequest(http.MethodPost, "/api/analyze", nil)
	first.RemoteAddr = "192.0.2.10:1234"
	firstResponse := httptest.NewRecorder()
	handler.ServeHTTP(firstResponse, first)

	now = now.Add(time.Minute)

	second := httptest.NewRequest(http.MethodPost, "/api/analyze", nil)
	second.RemoteAddr = "192.0.2.10:1234"
	secondResponse := httptest.NewRecorder()
	handler.ServeHTTP(secondResponse, second)

	if secondResponse.Code != http.StatusOK {
		t.Fatalf("response code = %d, want %d", secondResponse.Code, http.StatusOK)
	}
}

func TestRateLimitSkipsHealth(t *testing.T) {
	handler := withRateLimit(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), 1, time.Minute)

	for i := 0; i < 2; i++ {
		request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
		request.RemoteAddr = "192.0.2.10:1234"
		response := httptest.NewRecorder()

		handler.ServeHTTP(response, request)

		if response.Code != http.StatusOK {
			t.Fatalf("response code = %d, want %d", response.Code, http.StatusOK)
		}
	}
}
