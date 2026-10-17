#!/bin/sh
# Lance session.pb.test.js contre un PocketBase local vierge, avec le schéma du dépôt stonk-api.
# Prérequis : ~/Developer/stonk-api cloné, avec son binaire ./pocketbase-local (voir son README).
set -eu
API=${STONK_API_DIR:-$HOME/Developer/stonk-api}
DIR=$(mktemp -d)
RATE_LIMIT=off "$API/pocketbase-local" serve --dir "$DIR" --migrationsDir "$API/pb_migrations" --hooksDir "$API/pb_hooks" --http 127.0.0.1:8099 >/dev/null 2>&1 &
PID=$!
trap 'kill $PID; rm -rf "$DIR"' EXIT
until curl -s http://127.0.0.1:8099/api/health >/dev/null; do sleep 0.2; done
PB_TEST_URL=http://127.0.0.1:8099 npx vitest run src/remote/session.pb.test.js
