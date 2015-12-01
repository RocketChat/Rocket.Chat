cd ../../build
FILENAME=rocket.chat-`git describe --abbrev=0 --tags`."$TRAVIS_BUILD_NUMBER.$TRAVIS_BRANCH".tgz
mv Rocket.Chat.tar.gz  "$FILENAME"
ln -s  "$FILENAME" "$TRAVIS_BRANCH.rocket.chat-v.latest.tgz"

