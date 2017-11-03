#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

if [[ $SNAP_CHANNEL = "develop" ]]; then
    aws s3api put-object \
    --acl public-read \
    --website-redirect-location "https://download.rocket.chat/build/$ARTIFACT_NAME" \
    --bucket download.rocket.chat \
    --key "build/rocket.chat-$RC_VERSION.tgz"
fi

aws s3api put-object \
--acl public-read \
--website-redirect-location "https://download.rocket.chat/build/$ARTIFACT_NAME" \
--bucket download.rocket.chat \
--key "$SNAP_CHANNEL"
