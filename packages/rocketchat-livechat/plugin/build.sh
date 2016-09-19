cd packages/rocketchat-livechat/app
meteor npm install
meteor build --directory .meteor/build/

LIVECHAT_DIR="../../../public/livechat"
BUILD_DIR=".meteor/build/bundle/programs/web.browser"

rm -rf ../public/*
mkdir -p ../public/

rm -rf $LIVECHAT_DIR
mkdir -p $LIVECHAT_DIR/fonts

cp $BUILD_DIR/*.css $LIVECHAT_DIR/livechat.css
cp $BUILD_DIR/*.js $LIVECHAT_DIR/livechat.js
cp -r $BUILD_DIR/app/* $LIVECHAT_DIR/
cp $BUILD_DIR/head.html ../public/head.html

rm -rf .meteor/build/
