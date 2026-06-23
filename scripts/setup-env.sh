#!/usr/bin/env bash
# Create .env from template if missing.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "$ROOT/.env" ]]; then
  echo ".env already exists at $ROOT/.env"
  exit 0
fi

cp "$ROOT/.env.example" "$ROOT/.env"
echo "Created $ROOT/.env"
echo "Edit it with FRIEND_EMAIL, FRIEND_PASSWORD, GITHUB_TOKEN, VERCEL_TOKEN"
