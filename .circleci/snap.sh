#!/bin/bash
set -euvo pipefail
IFS=$'\n\t'

# Add launchpad to known hosts
ssh-keyscan -t rsa -H git.launchpad.net > ~/.ssh/known_hosts

git config user.name "CI Bot"
git config user.email "rocketchat.buildmaster@git.launchpad.net"

echo "Preparing to trigger a snap release for $SNAP_CHANNEL channel"

cd $PWD/.snapcraft

# Decrypt key
# openssl aes-256-cbc -K $encrypted_f5c8ae370556_key -iv $encrypted_f5c8ae370556_iv -in launchpadkey.enc -out launchpadkey -d

# Change permissions
# chmod 0600 launchpadkey

# We need some meta data so it'll actually commit.  This could be useful to have for debugging later.
echo "Tag: $CIRCLE_TAG \r\nBranch: $CIRCLE_BRANCH\r\nBuild: $CIRCLE_BUILD_NUM\r\nCommit: $CIRCLE_SHA1" > buildinfo

# Clone launchpad repo for the channel down.
# ssh-agent sh -c "ssh-add ./launchpadkey; git clone -b $SNAP_CHANNEL git+ssh://rocket.chat.buildmaster@git.launchpad.net/rocket.chat launchpad"
git clone -b $SNAP_CHANNEL git+ssh://rocket.chat.buildmaster@git.launchpad.net/rocket.chat launchpad

# Rarely will change, but just incase we copy it all
cp -r resources buildinfo launchpad/
sed s/#{RC_VERSION}/$RC_VERSION/ snapcraft.yaml > launchpad/snapcraft.yaml

cd launchpad
git add resources snapcraft.yaml buildinfo

# Another place where basic meta data will live for at a glance info
git commit -m "CircleCI Build: $CIRCLE_BUILD_NUM CircleCI Commit: $CIRCLE_SHA1"

# Push up up to the branch of choice.
# ssh-agent sh -c "ssh-add ../launchpadkey; git push origin $SNAP_CHANNEL"
git push origin $SNAP_CHANNEL

# Clean up
cd ..
# rm -rf launchpadkey launchpad
rm -rf launchpad
