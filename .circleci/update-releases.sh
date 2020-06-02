#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

curl -H "Content-Type: application/json" -H "X-Update-Token: $UPDATE_TOKEN" -d \
    "{\"commit\": \"$CIRCLE_SHA1\", \"tag\": \"$RC_VERSION\", \"branch\": \"$CIRCLE_BRANCH\", \"artifactName\": \"$ARTIFACT_NAME\", \"releaseType\": \"$RC_RELEASE\" }" \
    https://releases.rocket.chat/update

# Makes build fail if the release isn't there
curl --fail https://releases.rocket.chat/$RC_VERSION/info
