cd $TRAVIS_BUILD_DIR
export TAG=$(git describe --abbrev=0 --tags)
ln -s /tmp/build/Rocket.Chat.tar.gz "/tmp/deploy/$TAG.$TRAVIS_BUILD_NUMBER.$TRAVIS_BRANCH.tgz"
ln -s /tmp/build/Rocket.Chat.tar.gz "/tmp/deploy/$TRAVIS_BRANCH.rocket.chat-v.latest.tgz"
