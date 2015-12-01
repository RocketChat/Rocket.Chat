cd ../../build
FILENAME=rocket.chat-"$TRAVIS_TAG.$TRAVIS_BUILD_NUMBER.$TRAVIS_BRANCH".tgz
mv Rocket.Chat.tar.gz  "$FILENAME"
ln -s  "$FILENAME" "$TRAVIS_BRANCH.rocket.chat-v.latest.tgz"

