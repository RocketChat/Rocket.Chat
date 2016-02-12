#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

# ROCKET_DEPLOY_DIR="/tmp/deploy"
#TRAVIS_TAG=0.1.0

FILENAME="$ROCKET_DEPLOY_DIR/rocket.chat-$ARTIFACT_NAME.tgz";

ln -s /tmp/build/Rocket.Chat.tar.gz "$FILENAME"
gpg --armor --detach-sign "$FILENAME"
