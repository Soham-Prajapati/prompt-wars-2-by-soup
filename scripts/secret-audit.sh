#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "🔎 Running hardcoded secret audit..."

PATTERN='(AIza[0-9A-Za-z\-_]{35}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|(?i)(api[_-]?key|token|secret|password)\s*[:=]\s*["'"'"'][^$][^"'"'"']+["'"'"'])'

if rg -n --hidden \
  --glob '!.git/**' \
  --glob '!.env*' \
  --glob '!**/*.md' \
  --glob '!**/package-lock.json' \
  --glob '!**/node_modules/**' \
  "$PATTERN" .; then
  echo "❌ Potential hardcoded secret detected."
  exit 1
fi

echo "✅ No hardcoded secrets detected."
