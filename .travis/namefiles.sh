#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

#cd $TRAVIS_BUILD_DIR
#export TAG=$(git describe --abbrev=0 --tags)
ln -s /tmp/build/Rocket.Chat.tar.gz "/tmp/deploy/rocket.chat-$TRAVIS_BRANCH.tgz"
