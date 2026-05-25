package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	_ "github.com/jackc/pgx/v5/stdlib"
)

const (
	statsTimeout       = 3 * time.Second
	statsWriteTimeout  = 5 * time.Second
	statsPongWait      = 35 * time.Second
	statsPingInterval  = 25 * time.Second
	statsBroadcastSize = 1
)

type statisticsSnapshot struct {
	DistinctGuests int    `json:"distinctGuests"`
	ParserUses     int    `json:"parserUses"`
	UpdatedAt      string `json:"updatedAt"`
}

type statisticsVisitRequest struct {
	VisitorID string `json:"visitorId"`
}

type statsStore struct {
	db             *sql.DB
	secret         []byte
	allowedOrigins map[string]struct{}
	mu             sync.Mutex
	clients        map[*statsClient]struct{}
}

type statsClient struct {
	conn *websocket.Conn
	send chan statisticsSnapshot
}

var activeStats *statsStore

func newStatsStore(databaseURL string, secret string, allowedOrigins map[string]struct{}) (*statsStore, error) {
	if databaseURL == "" {
		return nil, errors.New("POSTGRES_URL is required")
	}

	databaseURL, err := secureDatabaseURL(databaseURL)
	if err != nil {
		return nil, err
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(4)
	db.SetMaxIdleConns(4)
	db.SetConnMaxLifetime(30 * time.Minute)

	store := &statsStore{
		db:             db,
		secret:         []byte(secret),
		allowedOrigins: allowedOrigins,
		clients:        map[*statsClient]struct{}{},
	}
	if err := store.migrate(context.Background()); err != nil {
		_ = db.Close()
		return nil, err
	}

	activeStats = store
	return store, nil
}

func recordParserUse(r *http.Request, parserUses int) {
	if activeStats == nil || parserUses <= 0 {
		return
	}
	if err := activeStats.recordParserUse(r.Context(), parserUses); err != nil {
		slog.Warn("record statistics", "error", err)
	}
}

func (s *statsStore) handleStatistics(w http.ResponseWriter, r *http.Request) {
	snapshot, err := s.snapshot(r.Context())
	if err != nil {
		slog.Warn("read statistics", "error", err)
		http.Error(w, "statistics unavailable", http.StatusServiceUnavailable)
		return
	}
	writeJSON(w, http.StatusOK, snapshot)
}

func (s *statsStore) handleStatisticsVisit(w http.ResponseWriter, r *http.Request) {
	var request statisticsVisitRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 512)).Decode(&request); err != nil {
		http.Error(w, "invalid visit payload", http.StatusBadRequest)
		return
	}

	visitorID := strings.TrimSpace(request.VisitorID)
	if len(visitorID) < 16 || len(visitorID) > 128 {
		http.Error(w, "invalid visitor id", http.StatusBadRequest)
		return
	}

	if err := s.recordVisit(r.Context(), visitorID); err != nil {
		slog.Warn("record visit", "error", err)
		http.Error(w, "statistics unavailable", http.StatusServiceUnavailable)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *statsStore) handleStatisticsStream(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(request *http.Request) bool {
			origin := request.Header.Get("Origin")
			if origin == "" {
				return true
			}
			_, ok := s.allowedOrigins[origin]
			return ok
		},
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Warn("upgrade statistics websocket", "error", err)
		return
	}

	client := &statsClient{
		conn: conn,
		send: make(chan statisticsSnapshot, statsBroadcastSize),
	}
	s.addClient(client)

	if snapshot, err := s.snapshot(r.Context()); err == nil {
		client.sendLatest(snapshot)
	}

	go s.writeClient(client)
	s.readClient(client)
}

func (s *statsStore) migrate(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, statsTimeout)
	defer cancel()

	_, err := s.db.ExecContext(ctx, `
		create table if not exists app_statistics (
			id boolean primary key default true check (id),
			parser_uses bigint not null default 0,
			updated_at timestamptz not null default now()
		);

		alter table app_statistics drop column if exists greeting;

		insert into app_statistics (id, parser_uses)
		values (true, 0)
		on conflict (id) do nothing;

		create table if not exists app_statistic_guests (
			guest_hash text primary key,
			first_seen_at timestamptz not null default now(),
			last_seen_at timestamptz not null default now()
		);
	`)
	return err
}

func (s *statsStore) recordVisit(ctx context.Context, visitorID string) error {
	ctx, cancel := context.WithTimeout(ctx, statsTimeout)
	defer cancel()

	result, err := s.db.ExecContext(ctx, `
		insert into app_statistic_guests (guest_hash)
		values ($1)
		on conflict (guest_hash) do nothing
	`, s.guestHash(visitorID))
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected > 0 {
		s.touchUpdatedAt(ctx)
		s.broadcastLatest()
	}
	return nil
}

func (s *statsStore) recordParserUse(ctx context.Context, parserUses int) error {
	ctx, cancel := context.WithTimeout(ctx, statsTimeout)
	defer cancel()

	_, err := s.db.ExecContext(ctx, `
		update app_statistics
		set parser_uses = parser_uses + $1,
			updated_at = now()
		where id = true
	`, parserUses)
	if err != nil {
		return err
	}

	s.broadcastLatest()
	return nil
}

func (s *statsStore) touchUpdatedAt(ctx context.Context) {
	_, err := s.db.ExecContext(ctx, `
		update app_statistics
		set updated_at = now()
		where id = true
	`)
	if err != nil {
		slog.Warn("touch statistics updated_at", "error", err)
	}
}

func (s *statsStore) snapshot(ctx context.Context) (statisticsSnapshot, error) {
	ctx, cancel := context.WithTimeout(ctx, statsTimeout)
	defer cancel()

	var snapshot statisticsSnapshot
	var distinctGuests int64
	var parserUses int64
	var updatedAt time.Time
	err := s.db.QueryRowContext(ctx, `
		select
			(select count(*) from app_statistic_guests) as distinct_guests,
			app_statistics.parser_uses,
			app_statistics.updated_at
		from app_statistics
		where app_statistics.id = true
	`).Scan(&distinctGuests, &parserUses, &updatedAt)
	if err != nil {
		return statisticsSnapshot{}, err
	}

	snapshot.DistinctGuests = int(distinctGuests)
	snapshot.ParserUses = int(parserUses)
	snapshot.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return snapshot, nil
}

func (s *statsStore) guestHash(client string) string {
	mac := hmac.New(sha256.New, s.secret)
	_, _ = mac.Write([]byte(client))
	return hex.EncodeToString(mac.Sum(nil))
}

func (s *statsStore) addClient(client *statsClient) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.clients[client] = struct{}{}
}

func (s *statsStore) removeClient(client *statsClient) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.clients[client]; ok {
		delete(s.clients, client)
		close(client.send)
	}
}

func (s *statsStore) broadcastLatest() {
	snapshot, err := s.snapshot(context.Background())
	if err != nil {
		slog.Warn("broadcast statistics", "error", err)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for client := range s.clients {
		client.sendLatest(snapshot)
	}
}

func (s *statsStore) readClient(client *statsClient) {
	defer func() {
		s.removeClient(client)
		_ = client.conn.Close()
	}()

	client.conn.SetReadLimit(256)
	_ = client.conn.SetReadDeadline(time.Now().Add(statsPongWait))
	client.conn.SetPongHandler(func(string) error {
		return client.conn.SetReadDeadline(time.Now().Add(statsPongWait))
	})

	for {
		if _, _, err := client.conn.NextReader(); err != nil {
			return
		}
	}
}

func (s *statsStore) writeClient(client *statsClient) {
	ticker := time.NewTicker(statsPingInterval)
	defer func() {
		ticker.Stop()
		s.removeClient(client)
		_ = client.conn.Close()
	}()

	for {
		select {
		case snapshot, ok := <-client.send:
			_ = client.conn.SetWriteDeadline(time.Now().Add(statsWriteTimeout))
			if !ok {
				_ = client.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := client.conn.WriteJSON(snapshot); err != nil {
				return
			}
		case <-ticker.C:
			_ = client.conn.SetWriteDeadline(time.Now().Add(statsWriteTimeout))
			if err := client.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *statsClient) sendLatest(snapshot statisticsSnapshot) {
	select {
	case c.send <- snapshot:
	default:
		select {
		case <-c.send:
		default:
		}
		c.send <- snapshot
	}
}

func secureDatabaseURL(rawURL string) (string, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "", errors.New("POSTGRES_URL is invalid")
	}
	if parsed.Scheme != "postgres" && parsed.Scheme != "postgresql" {
		return "", errors.New("POSTGRES_URL must use postgres or postgresql")
	}

	query := parsed.Query()
	sslMode := query.Get("sslmode")
	if sslMode == "disable" && !isLocalDatabaseHost(parsed.Hostname()) {
		return "", errors.New("POSTGRES_URL must not disable SSL for remote databases")
	}
	if sslMode == "" && !isLocalDatabaseHost(parsed.Hostname()) {
		query.Set("sslmode", "require")
		parsed.RawQuery = query.Encode()
	}
	return parsed.String(), nil
}

func isLocalDatabaseHost(host string) bool {
	if host == "localhost" {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}
