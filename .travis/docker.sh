#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

CURL_URL="https://registry.hub.docker.com/u/rocketchat/rocket.chat/trigger/$PUSHTOKEN/"

CURL_DATA='{"source_type":"Tag","source_name":"'"$TRAVIS_TAG"'"}';

curl -H "Content-Type: application/json" --data "$CURL_DATA" -X POST "$CURL_URL"

