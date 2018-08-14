#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

curl -X POST \
-H "X-Update-Token: ${UPDATE_TOKEN}" \
https://releases.rocket.chat/update
