package main

import "testing"

func TestStatsStoreHashesGuestsWithSecret(t *testing.T) {
	firstStore := &statsStore{secret: []byte("secret")}
	secondStore := &statsStore{secret: []byte("other-secret")}

	firstHash := firstStore.guestHash("192.0.2.10:1000")
	secondHash := firstStore.guestHash("192.0.2.10:1000")
	otherSecretHash := secondStore.guestHash("192.0.2.10:1000")

	if firstHash == "" {
		t.Fatal("guest hash is empty")
	}
	if firstHash != secondHash {
		t.Fatal("guest hash should be stable for the same secret and client")
	}
	if firstHash == otherSecretHash {
		t.Fatal("guest hash should change with a different secret")
	}
}

func TestSecureDatabaseURLRequiresSSLForRemoteDatabases(t *testing.T) {
	_, err := secureDatabaseURL("postgres://user:pass@example.supabase.co:5432/postgres?sslmode=disable")
	if err == nil {
		t.Fatal("secureDatabaseURL() error is nil, want error")
	}
}

func TestSecureDatabaseURLAddsSSLForRemoteDatabases(t *testing.T) {
	databaseURL, err := secureDatabaseURL("postgres://user:pass@example.supabase.co:5432/postgres")
	if err != nil {
		t.Fatalf("secureDatabaseURL() error = %v", err)
	}
	if databaseURL != "postgres://user:pass@example.supabase.co:5432/postgres?sslmode=require" {
		t.Fatalf("databaseURL = %q, want sslmode=require", databaseURL)
	}
}

func TestSecureDatabaseURLAllowsLocalWithoutSSL(t *testing.T) {
	databaseURL, err := secureDatabaseURL("postgres://user:pass@localhost:5432/postgres?sslmode=disable")
	if err != nil {
		t.Fatalf("secureDatabaseURL() error = %v", err)
	}
	if databaseURL != "postgres://user:pass@localhost:5432/postgres?sslmode=disable" {
		t.Fatalf("databaseURL = %q, want local url unchanged", databaseURL)
	}
}
