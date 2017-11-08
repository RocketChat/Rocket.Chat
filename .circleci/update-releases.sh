#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

if [[ $RC_RELEASE = "develop" ]]; then
    aws s3api put-object \
    --acl public-read \
    --website-redirect-location "https://download.rocket.chat/build/rocket.chat-$ARTIFACT_NAME.tgz" \
    --bucket download.rocket.chat \
    --key "build/rocket.chat-$RC_VERSION.tgz"
fi

aws s3api put-object \
--acl public-read \
--website-redirect-location "https://download.rocket.chat/build/rocket.chat-$ARTIFACT_NAME.tgz" \
--bucket download.rocket.chat \
--key "$RC_RELEASE"
