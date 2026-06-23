#!/usr/bin/env bash
# Source .env from repo root. Usage: source scripts/load-env.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.example to .env and fill in tokens." >&2
  return 1 2>/dev/null || exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# gh CLI prefers GH_TOKEN; avoid conflicting with GITHUB_TOKEN during login
export GH_TOKEN="${GITHUB_TOKEN:-}"
