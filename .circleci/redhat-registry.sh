#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

if [[ $CIRCLE_TAG ]]; then
  curl -X POST \
  https://connect.redhat.com/api/v2/projects/$REDHAT_REGISTRY_PID/build \
  -H "Authorization: Bearer $REDHAT_REGISTRY_KEY" \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/json' \
  -d '{"tag":"'$CIRCLE_TAG'"}'
fi
