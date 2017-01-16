#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

if [[ $TRAVIS_TAG ]]
 then
    CHANNEL=stable
else
    CHANNEL=edge
fi

echo "snapping release for $CHANNEL channel"

cd $PWD/../.snapcraft

openssl aes-256-cbc -K $encrypted_f5c8ae370556_key -iv $encrypted_f5c8ae370556_iv -in launchpadkey.enc -out launchpadkey -d

echo "Tag: $TRAVIS_TAG \r\nBranch: $TRAVIS_BRANCH\r\nBuild: $TRAVIS_BUILD_NUMBER\r\nCommit: $TRAVIS_COMMIT" > buildinfo

GIT_SSH_COMMAND="ssh -i launchpadkey" git clone -b $CHANNEL git+ssh://rocket.chat.buildmaster@git.launchpad.net/rocket.chat launchpad

cp -r bin snapcraft.yaml buildinfo launchpad/

cd launchpad

git add bin snapcraft.yaml buildinfo

git commit -m "Travis Build: $TRAVIS_BUILD_NUMBER Travis Commit: $TRAVIS_COMMIT"

GIT_SSH_COMMAND="ssh -i ../launchpadkey" git push origin $CHANNEL

rm -rf launchpadkey launchpad