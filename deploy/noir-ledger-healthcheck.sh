#!/usr/bin/env bash
set -euo pipefail

HEALTH_URL="http://127.0.0.1:3000/api/health"

if ! curl --fail --silent --show-error --max-time 10 "$HEALTH_URL" >/dev/null; then
  systemctl restart noir-ledger.service
fi
