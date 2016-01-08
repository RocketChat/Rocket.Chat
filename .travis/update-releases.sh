#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

CURL_URL="https://rocket.chat/releases/update"

curl -X POST "$CURL_URL"
