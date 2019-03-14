export NODE_ENV="production"
export LIVECHAT_DIR="../../../public/livechat"
export BUILD_DIR="../build"
export BUNDLE_DIR="../build/bundle/programs/web.browser.legacy"
export LIVECHAT_APP_DIR="../../../app/livechat"
export LATEST_LIVECHAT_VERSION="1.0"

cd packages/rocketchat-livechat/.app
meteor npm install --production
meteor build --headless --directory $BUILD_DIR

rm -rf $LIVECHAT_DIR
mkdir -p $LIVECHAT_DIR
cp $BUNDLE_DIR/*.css $LIVECHAT_DIR/livechat.css
cp $BUNDLE_DIR/*.js $LIVECHAT_DIR/livechat.js

rm -rf $LIVECHAT_APP_DIR/public
mkdir $LIVECHAT_APP_DIR/public

cp $BUNDLE_DIR/head.html $LIVECHAT_APP_DIR/public/head.html
rm -rf $BUILD_DIR

#NEW LIVECHAT#
echo "Installing new Livechat..."
cd $LIVECHAT_DIR
mkdir -p $LATEST_LIVECHAT_VERSION
cd $LATEST_LIVECHAT_VERSION

curl -sOL https://github.com/RocketChat/Rocket.Chat.Livechat/releases/latest/download/build.tar.gz
tar -xf build.tar.gz
rm build.tar.gz

cd $LIVECHAT_APP_DIR/public

cp $LIVECHAT_DIR/$LATEST_LIVECHAT_VERSION/index.html .
cp $LIVECHAT_DIR/$LATEST_LIVECHAT_VERSION/widget-demo.html .
