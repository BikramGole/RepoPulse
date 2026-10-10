#!/usr/bin/env bash
set -e

# Resolve the directory where this script is located
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🚀 Starting RepoPulse on http://localhost:3000 ..."

if command -v pnpm &> /dev/null; then
  exec pnpm dev
elif command -v npm &> /dev/null; then
  exec npm run dev
else
  exec npx next dev
fi
