#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

FILENAME="$ROCKET_DEPLOY_DIR/rocket.chat-$ARTIFACT_NAME.tgz";

ln -s /tmp/build/Rocket.Chat.tar.gz "$FILENAME"
ln -s /tmp/build/Rocket.Chat.tar.gz "$ROCKET_DEPLOY_DIR/rocket.chat-latest.tgz"
