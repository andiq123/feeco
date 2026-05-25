package main

import (
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"
)

type clientRateLimit struct {
	windowStart time.Time
	count       int
	lastSeen    time.Time
}

type rateLimiter struct {
	mu       sync.Mutex
	clients  map[string]clientRateLimit
	limit    int
	window   time.Duration
	now      func() time.Time
	next     http.Handler
	skipPath map[string]struct{}
}

func withRateLimit(next http.Handler, limit int, window time.Duration) http.Handler {
	return newRateLimiter(next, limit, window, time.Now)
}

func newRateLimiter(next http.Handler, limit int, window time.Duration, now func() time.Time) http.Handler {
	if limit <= 0 || window <= 0 {
		return next
	}
	return &rateLimiter{
		clients: map[string]clientRateLimit{},
		limit:   limit,
		window:  window,
		now:     now,
		next:    next,
		skipPath: map[string]struct{}{
			"/healthz": {},
		},
	}
}

func (l *rateLimiter) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if _, ok := l.skipPath[r.URL.Path]; ok || r.Method == http.MethodOptions {
		l.next.ServeHTTP(w, r)
		return
	}

	now := l.now()
	key := clientKey(r)

	l.mu.Lock()
	state := l.clients[key]
	if state.windowStart.IsZero() || now.Sub(state.windowStart) >= l.window {
		state.windowStart = now
		state.count = 0
	}
	state.count++
	state.lastSeen = now
	l.clients[key] = state

	allowed := state.count <= l.limit
	retryAfter := int(l.window.Seconds())
	if !state.windowStart.IsZero() {
		remaining := l.window - now.Sub(state.windowStart)
		retryAfter = max(1, int(remaining.Seconds()))
	}
	l.cleanup(now)
	l.mu.Unlock()

	if !allowed {
		w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
		http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
		return
	}

	l.next.ServeHTTP(w, r)
}

func (l *rateLimiter) cleanup(now time.Time) {
	cutoff := now.Add(-2 * l.window)
	for key, state := range l.clients {
		if state.lastSeen.Before(cutoff) {
			delete(l.clients, key)
		}
	}
}

func clientKey(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		if parsed := net.ParseIP(host); parsed != nil {
			return parsed.String()
		}
	}
	return r.RemoteAddr
}
