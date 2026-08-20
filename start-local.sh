#!/usr/bin/env bash
set -e

cd -- "$(dirname -- "$0")"

echo "Starting Ethiopia AI Transparency..."
echo "Keep this terminal open while using the app."
echo "Your browser will open automatically when the site is ready."
echo

open_when_ready() {
  for _ in $(seq 1 90); do
    if command -v curl >/dev/null 2>&1 && curl --fail --silent --output /dev/null http://localhost:5173; then
      if command -v xdg-open >/dev/null 2>&1; then
        xdg-open http://localhost:5173 >/dev/null 2>&1
      fi
      return
    fi
    sleep 1
  done
}

open_when_ready &
corepack pnpm dev
