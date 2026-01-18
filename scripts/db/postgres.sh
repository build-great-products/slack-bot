#!/usr/bin/env bash
set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Compose file autodetect; override by exporting COMPOSE_FILE if needed
if [ -z "${COMPOSE_FILE:-}" ]; then
  if   [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
  elif [ -f "$PROJECT_ROOT/compose.yml" ];        then COMPOSE_FILE="$PROJECT_ROOT/compose.yml"
  elif [ -f "$PROJECT_ROOT/compose.yaml" ];       then COMPOSE_FILE="$PROJECT_ROOT/compose.yaml"
  else
    echo "❌ Could not find a compose file (docker-compose.yml/compose.yml) at project root."
    exit 1
  fi
fi

SERVICE="${SERVICE:-postgres}"            # docker compose service name
ENV_FILE="${ENV_FILE:-$PROJECT_ROOT/.env}"

# --- Env loading & validation (used for printing URLs/helpful messages) ---
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

: "${POSTGRES_DB:?Error: POSTGRES_DB not set in .env}"
: "${POSTGRES_USER:?Error: POSTGRES_USER not set in .env}"
: "${POSTGRES_PASSWORD:?Error: POSTGRES_PASSWORD not set in .env}"

# Prefer DATABASE_URL if provided; otherwise synthesize one
build_conn_url() {
  local host port
  host="${DB_HOST:-localhost}"
  # Try to detect mapped port from compose; fall back to 5432
  if port_line="$(docker compose -f "$COMPOSE_FILE" port "$SERVICE" 5432 2>/dev/null || true)"; then
    port="${port_line##*:}"
    [[ -n "$port" ]] || port="5432"
  else
    port="5432"
  fi

  if [[ -n "${DATABASE_URL:-}" ]]; then
    echo "$DATABASE_URL"
  else
    echo "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${host}:${port}/${POSTGRES_DB}"
  fi
}

# --- Docker Compose helpers ---
compose() { docker compose -f "$COMPOSE_FILE" "$@"; }
container_id() { compose ps -q "$SERVICE"; }

health_status() {
  local cid
  cid="$(container_id || true)"
  [[ -n "$cid" ]] || { echo "none"; return 0; }  # container doesn't exist yet
  docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid"
}

is_running() {
  local status
  status="$(health_status)"
  case "$status" in
    healthy|running) return 0 ;;
    *)               return 1 ;;
  esac
}

wait_until_healthy() {
  local timeout="${1:-60}" # seconds
  local start now status
  start="$(date +%s)"
  echo "⏳ Waiting for $SERVICE to become healthy (timeout ${timeout}s)..."
  while true; do
    status="$(health_status)"
    if [[ "$status" == "healthy" ]]; then
      echo "✅ $SERVICE is healthy"
      return 0
    fi
    now="$(date +%s)"
    if (( now - start >= timeout )); then
      echo "❌ Timed out waiting for $SERVICE to become healthy (last status: $status)"
      return 1
    fi
    sleep 1
  done
}

pg_isready_inside() {
  # Try readiness from inside the container with the configured user/db
  if ! is_running; then return 1; fi
  compose exec -T "$SERVICE" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t 1 -q 2>/dev/null
}

show_status() {
  if is_running && pg_isready_inside; then
    echo "✅ PostgreSQL (docker) is running"
    echo "🔗 Connection: $(build_conn_url)"
  else
    echo "🔴 PostgreSQL (docker) is not running"
  fi
}

start_postgres() {
  if is_running && pg_isready_inside; then
    echo "✅ PostgreSQL is already running"
    echo "🔗 Connection: $(build_conn_url)"
    return 0
  fi

  echo "🚀 Starting PostgreSQL container..."
  compose up -d "$SERVICE"

  # Wait for container health
  wait_until_healthy 90 || {
    echo "ℹ️ Container healthcheck didn't reach 'healthy'. Checking pg_isready..."
  }

  # Extra guard: pg_isready inside the container
  for i in {1..30}; do
    if pg_isready_inside; then
      echo "✅ PostgreSQL is ready!"
      echo "📊 Database: $POSTGRES_DB"
      echo "👤 User: $POSTGRES_USER"
      echo "🔗 Connection: $(build_conn_url)"
      return 0
    fi
    sleep 1
  done

  echo "❌ PostgreSQL failed readiness checks"
  # Show last few lines of logs to help debug
  echo "—— docker logs (tail) ——"
  compose logs --no-color --tail=80 "$SERVICE" || true
  return 1
}

stop_postgres() {
  if ! container_id >/dev/null 2>&1; then
    echo "ℹ️  PostgreSQL container not created yet"
    return 0
  fi
  if ! is_running; then
    echo "ℹ️  PostgreSQL container is not running"
    return 0
  fi
  echo "🛑 Stopping PostgreSQL container..."
  compose stop "$SERVICE"
  echo "✅ PostgreSQL stopped"
}

restart_postgres() {
  echo "🔄 Restarting PostgreSQL container..."
  compose restart "$SERVICE" || {
    echo "ℹ️ Container may not exist yet; starting instead..."
    compose up -d "$SERVICE"
  }
  wait_until_healthy 90 || true
  # Guard with pg_isready
  for i in {1..30}; do
    if pg_isready_inside; then
      echo "✅ PostgreSQL restarted and ready"
      echo "🔗 Connection: $(build_conn_url)"
      return 0
    fi
    sleep 1
  done
  echo "⚠️ Restart finished but readiness not confirmed; check logs:"
  compose logs --no-color --tail=80 "$SERVICE" || true
}

destroy_postgres() {
  # Stop if running
  if is_running; then
    echo "🛑 Stopping PostgreSQL first..."
    compose stop "$SERVICE" || true
  fi

  echo "⚠️  This will permanently delete all PostgreSQL data (docker volume)!"
  # Try to determine the named volume. Defaults to Compose's conventional prefixing.
  PROJECT_NAME="${COMPOSE_PROJECT_NAME:-$(basename "$PROJECT_ROOT")}"
  VOLUME_CANDIDATE="${PROJECT_NAME}_postgres_data"

  # If the container exists, try to get the exact data volume name from mounts
  VOL_FROM_INSPECT=""
  if cid="$(container_id || true)"; [[ -n "$cid" ]]; then
    VOL_FROM_INSPECT="$(docker inspect -f '{{range .Mounts}}{{if and (eq .Type "volume") (eq .Destination "/var/lib/postgresql/data")}}{{.Name}}{{end}}{{end}}' "$cid" || true)"
  fi
  VOLUME_NAME="${VOL_FROM_INSPECT:-$VOLUME_CANDIDATE}"

  echo "📦 Volume to remove (best guess): $VOLUME_NAME"
  read -p "Are you sure you want to destroy ALL PostgreSQL data? (yes/no): " -r
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Cancelled"
    return 1
  fi

  echo "🗑️  Removing container (if present)..."
  # Remove only the postgres service container; keep other services intact
  compose rm -s -f "$SERVICE" || true

  echo "🗑️  Removing data volume..."
  if docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
    docker volume rm -f "$VOLUME_NAME"
    echo "✅ Removed volume $VOLUME_NAME"
  else
    # Fallback: attempt to remove any matching volume with project prefix
    docker volume rm -f "$(docker volume ls -q --filter "name=${PROJECT_NAME}_postgres_data")" >/dev/null 2>&1 || true
    echo "ℹ️  Named volume not found; nothing to remove."
  fi

  echo "✅ PostgreSQL data destroyed"
}

usage() {
  cat << EOF
PostgreSQL (Docker Compose) Management Script

Usage: $(basename "$0") [COMMAND]

Commands:
    start     Start PostgreSQL container and wait for readiness
    stop      Stop PostgreSQL container
    restart   Restart PostgreSQL container and wait for readiness
    status    Show PostgreSQL status and connection string
    destroy   Remove postgres container and DELETE data volume (destructive)

Environment overrides:
    COMPOSE_FILE    Path to compose file (auto-detected)
    SERVICE         Compose service name (default: postgres)
    ENV_FILE        Path to .env file (default: $PROJECT_ROOT/.env)
EOF
}

case "${1:-}" in
  start)   start_postgres ;;
  stop)    stop_postgres ;;
  restart) restart_postgres ;;
  status)  show_status ;;
  destroy) destroy_postgres ;;
  *)       usage; [ -n "${1:-}" ] && echo "Error: Unknown command '$1'"; exit 1 ;;
esac
