#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

CHANNEL=develop

if [[ "${CIRCLE_TAG+SET}" = "SET" ]]; then
    echo 'if'
    if [[ $CIRCLE_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+-rc\.[0-9]+ ]]; then
        CHANNEL=candidate
    elif [[ $CIRCLE_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        CHANNEL=stable
    fi
fi

if [[ $CHANNEL = "develop" ]]; then
    RC_VERSION=0.59.0-develop
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
--key "$CHANNEL"
