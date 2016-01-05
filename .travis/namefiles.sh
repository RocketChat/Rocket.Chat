#!/bin/bash 
set -xeuo pipefail
IFS=$'\n\t'

#cd $TRAVIS_BUILD_DIR
#export TAG=$(git describe --abbrev=0 --tags)
cp /tmp/build/Rocket.Chat.tar.gz "$ROCKET_DEPLOY_DIR/rocket.chat.tgz"
gpg --armor --detach-sign "$ROCKET_DEPLOY_DIR/rocket.chat.tgz"
ls -l $ROCKET_DEPLOY_DIR
