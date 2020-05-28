#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

curl -X POST \
-H "X-Update-Token: ${UPDATE_TOKEN}" \
https://releases.rocket.chat/update

# Makes build fail if the release isn't there
curl --fail https://releases.rocket.chat/$RC_VERSION/info
