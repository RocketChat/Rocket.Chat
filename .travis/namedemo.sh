cd ../../build
FILENAME=demo.rocket.chat-`cat version.txt`.tgz
mv Rocket.Chat.tar.gz  $FILENAME
ln -s  $FILENAME demo.rocket.chat-v.latest.tgz

