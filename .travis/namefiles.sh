cd ../../build
FILENAME=rocket.chat-`cat version.txt`.tgz
mv Rocket.Chat.tar.gz  "$FILENAME"
ln -s  "$FILENAME" "$TRAVIS_BRANCH.rocket.chat-v.latest.tgz"

