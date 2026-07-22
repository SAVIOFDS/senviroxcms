#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
SSL_DIR="$ROOT/deploy/ssl"
mkdir -p "$SSL_DIR"
DOMAIN="${1:-localhost}"

openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
  -keyout "$SSL_DIR/privkey.pem" \
  -out "$SSL_DIR/fullchain.pem" \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1"

chmod 600 "$SSL_DIR/privkey.pem"
echo "Wrote $SSL_DIR/fullchain.pem and privkey.pem for $DOMAIN"
echo "For real hosts, replace with Let's Encrypt or your CA certificates."
