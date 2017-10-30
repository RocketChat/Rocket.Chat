#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

if [[ $CIRCLE_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+-rc\.[0-9]+ ]]; then
    CHANNEL=candidate
elif [[ $CIRCLE_TAG ]]; then
    CHANNEL=stable
else
    CHANNEL=develop
fi

aws s3api put-object --acl public-read --website-redirect-location "https://download.rocket.chat/build/$ARTIFACT_NAME" --bucket download.rocket.chat --key "$CHANNEL"
