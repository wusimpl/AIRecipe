#!/usr/bin/env bash

set -euo pipefail

pnpm build
pnpm start --port 8090 --hostname 0.0.0.0
