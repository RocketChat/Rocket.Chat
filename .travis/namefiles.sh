cd ../../build
FILENAME=rocket.chat-`cat version.txt`.tgz
mv Rocket.Chat.tar.gz  $FILENAME
ln -s  $FILENAME rocket.chat-v.latest.tgz

