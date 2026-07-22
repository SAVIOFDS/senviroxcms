#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "Missing .env — run: node scripts/generate-secrets.mjs your.domain.com"
  exit 1
fi

if [ ! -f deploy/ssl/fullchain.pem ] || [ ! -f deploy/ssl/privkey.pem ]; then
  echo "Missing TLS material in deploy/ssl/"
  echo "Dev/self-signed: sh scripts/gen-dev-certs.sh your.domain.com"
  echo "Prod: copy fullchain.pem + privkey.pem from your CA/Let's Encrypt"
  exit 1
fi

# shellcheck disable=SC1091
set -a
. ./.env
set +a

if [ -z "${JWT_SECRET:-}" ] || [ -z "${REDIS_PASSWORD:-}" ] || [ -z "${METRICS_TOKEN:-}" ]; then
  echo "JWT_SECRET, REDIS_PASSWORD, and METRICS_TOKEN are required in .env"
  exit 1
fi

if [ -z "${CORS_ORIGIN:-}" ] || [ -z "${NEXT_PUBLIC_APP_URL:-}" ] || [ -z "${NEXT_PUBLIC_API_URL:-}" ]; then
  echo "CORS_ORIGIN, NEXT_PUBLIC_APP_URL, and NEXT_PUBLIC_API_URL are required"
  exit 1
fi

echo "Building and starting SENVIROX..."
docker compose pull || true
docker compose build
docker compose up -d --remove-orphans
docker compose ps

echo "Smoke checks..."
sleep 3
curl -fsS http://127.0.0.1/nginx-health >/dev/null || curl -kfsS https://127.0.0.1/nginx-health >/dev/null
curl -fsS http://127.0.0.1/health/live >/dev/null || curl -kfsS https://127.0.0.1/health/live >/dev/null
echo "Deploy OK — open ${NEXT_PUBLIC_APP_URL}"
