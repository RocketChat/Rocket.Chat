#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

CURL_URL="https://registry.hub.docker.com/u/rocketchat/rocket.chat/trigger/$PUSHTOKEN/"

if ["$TRAVIS_TAG" ]; then
  CURL_DATA='{"source_type":"Tag","source_name":"'"$TRAVIS_TAG"'","docker_tag":"'"$TRAVIS_TAG"'"}';
else
  if [ "$TRAVIS_BRANCH" == "master" ]; then
    CURL_DATA='{"source_type":"Branch","source_name":"master","docker_tag":"latest"}';
  else
    CURL_DATA='{"source_type":"Branch","source_name":"'"$TRAVIS_BRANCH"'","docker_tag":"'"$TRAVIS_BRANCH"'"}';
  fi
fi

curl -H "Content-Type: application/json" --data "$CURL_DATA" -X POST "$CURL_URL"
echo -H "Content-Type: application/json" --data "$CURL_DATA" -X POST "CURL_URL"
