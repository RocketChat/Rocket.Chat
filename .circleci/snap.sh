#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

# Add launchpad to known hosts
ssh-keyscan -t rsa -H git.launchpad.net > ~/.ssh/known_hosts

echo "Preparing to trigger a snap release for $SNAP_CHANNEL channel"

cd $PWD/.snapcraft

# We need some meta data so it'll actually commit.  This could be useful to have for debugging later.
echo -e "Tag: $CIRCLE_TAG\r\nBranch: $CIRCLE_BRANCH\r\nBuild: $CIRCLE_BUILD_NUM\r\nCommit: $CIRCLE_SHA1" > buildinfo

# Clone launchpad repo for the channel down.
git clone -b $SNAP_CHANNEL git+ssh://rocket.chat.buildmaster@git.launchpad.net/rocket.chat launchpad

# Rarely will change, but just incase we copy it all
cp -r resources buildinfo launchpad/
sed s/#{RC_VERSION}/$RC_VERSION/ snapcraft.yaml > launchpad/snapcraft.yaml
sed s/#{RC_VERSION}/$RC_VERSION/ resources/prepareRocketChat > launchpad/resources/prepareRocketChat

cd launchpad
git add resources snapcraft.yaml buildinfo

# Set commit author details
git config user.email "buildmaster@rocket.chat"
git config user.name "CircleCI"

# Another place where basic meta data will live for at a glance info
git commit -m "CircleCI Build: $CIRCLE_BUILD_NUM CircleCI Commit: $CIRCLE_SHA1"

# Push up up to the branch of choice.
git push origin $SNAP_CHANNEL

# Clean up
cd ..
rm -rf launchpad
