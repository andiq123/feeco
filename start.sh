#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_PID=""
FRONTEND_PID=""

load_env_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$file"
    set +a
  fi
}

cleanup() {
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

command -v go >/dev/null 2>&1 || {
  echo "go is required but was not found in PATH" >&2
  exit 1
}

command -v npm >/dev/null 2>&1 || {
  echo "npm is required but was not found in PATH" >&2
  exit 1
}

echo "Starting backend with Air on http://localhost:8080"
(
  cd "$BACKEND_DIR"
  load_env_file "$BACKEND_DIR/.env"
  go run github.com/air-verse/air@latest -c .air.toml
) &
BACKEND_PID=$!

echo "Starting frontend with Next.js on http://localhost:3000"
(
  cd "$FRONTEND_DIR"
  load_env_file "$FRONTEND_DIR/.env.local"
  BACKEND_URL="${BACKEND_URL:-http://localhost:8080}" npm run dev
) &
FRONTEND_PID=$!

while true; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    wait "$BACKEND_PID" || exit $?
    exit 0
  fi
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    wait "$FRONTEND_PID" || exit $?
    exit 0
  fi
  sleep 1
done
