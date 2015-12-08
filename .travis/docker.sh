#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

CURL_HEADER="Content-Type: application/json"
CURL_URL="https://registry.hub.docker.com/u/rocketchat/rocket.chat/trigger/$PUSHTOKEN/"

if ["$TRAVIS_TAG" ]; then
  CURL_DATA='{"source_type":"Tag","source_name":"$TRAVIS_TAG","docker_tag":"$TRAVIS_TAG"}';
else
  if ["$TRAVIS_BRANCH" ="master" ]; then
    CURL_DATA='{"source_type":"Branch","source_name":"master","docker_tag":"latest"}';
  else
    CURL_DATA='{"source_type":"Branch","source_name":"'$TRAVIS_BRANCH'","docker_tag":"'$TRAVIS_BRANCH'"}';
  fi
fi

echo -H '"'$CURL_HEADER'"' --data "'"$CURL_DATA"'" -X POST CURL_URL
curl -H '"'$CURL_HEADER'"' --data "'"$CURL_DATA"'" -X POST $CURL_URL
