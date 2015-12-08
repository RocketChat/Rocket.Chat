#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# TRAVIS_TAG='v0.7'
# TAG="v0.7"
# TRAVIS_BUILD_NUMBER="1234"
# TRAVIS_BRANCH="develop"
# PUSHTOKEN="secret"

CURL_HEADER="Content-Type: application/json"
CURL_URL="https://registry.hub.docker.com/u/rocketchat/rocket.chat/trigger/$PUSHTOKEN/"

if [ -z ${TRAVIS_TAG+x} ];
then
CURL_DATA='{"source_type": "Branch", "source_name": "'$TRAVIS_BRANCH'", "docker_tag": "'$TRAVIS_BUILD_NUMBER.$TRAVIS_BRANCH'"}';
else
CURL_DATA='{"source_type": "Tag", "source_name": "'$TRAVIS_TAG'", "docker_tag": "'$TRAVIS_BUILD_NUMBER.$TRAVIS_BRANCH.$TRAVIS_TAG'"}';
fi

curl -H "${CURL_HEADER}" --data "${CURL_DATA}" -X POST "${CURL_URL}"


