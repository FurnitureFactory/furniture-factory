#!/usr/bin/env bash
# Deploy Furniture Factory using tokens from .env (gitignored).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/xingjia"
# shellcheck disable=SC1091
source "$ROOT/scripts/load-env.sh"

REPO_NAME="${1:-${GITHUB_REPO:-furniture-factory}}"
PROJECT="${VERCEL_PROJECT:-$REPO_NAME}"
SCOPE="${VERCEL_SCOPE:-tablesfurniturefactorysg-1940s-projects}"

cd "$ROOT"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN missing in .env" >&2
  echo "" >&2
  echo "One-time setup (use FRIEND_EMAIL / FRIEND_PASSWORD in browser, not here):" >&2
  echo "  1. https://github.com/login — sign in as friend" >&2
  echo "  2. https://github.com/settings/tokens — classic token, repo scope" >&2
  echo "  3. Paste token as GITHUB_TOKEN in .env" >&2
  exit 1
fi

echo "→ Authenticating GitHub CLI with token…"
export GH_TOKEN="$GITHUB_TOKEN"
gh auth status

OWNER="$(gh api user -q .login)"
REMOTE="https://github.com/$OWNER/$REPO_NAME.git"

echo "→ GitHub repo: $OWNER/$REPO_NAME"
if gh repo view "$OWNER/$REPO_NAME" &>/dev/null; then
  echo "  Repo exists — pushing latest…"
  git remote remove origin 2>/dev/null || true
  git remote add origin "$REMOTE"
  git push -u origin main
else
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  echo "  Created and pushed."
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo ""
  echo "VERCEL_TOKEN missing — GitHub push done. Add VERCEL_TOKEN to .env and re-run."
  echo "  Create at: https://vercel.com/account/tokens (log in as friend first)"
  exit 0
fi

echo "→ Deploying to Vercel (project: $PROJECT)…"
cd "$SITE"
export VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

if [[ ! -f .vercel/project.json ]]; then
  npx --yes vercel link --yes --token "$VERCEL_TOKEN" --scope "$SCOPE" --project "$PROJECT" 2>/dev/null \
    || npx --yes vercel link --yes --token "$VERCEL_TOKEN" --scope "$SCOPE"
fi

DEPLOY_URL="$(npx --yes vercel deploy --prod --yes --token "$VERCEL_TOKEN" --scope "$SCOPE")"
echo ""
echo "✓ Live: $DEPLOY_URL"
