#!/bin/bash
set -x
set -euvo pipefail

export METEOR_SETTINGS='{"public": {"sandstorm": true}}'
export NODE_ENV=production
exec node /start.js -p 8000
