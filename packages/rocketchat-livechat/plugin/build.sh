export NODE_ENV="production"
export LIVECHAT_DIR="../../../public/livechat"
export BUILD_DIR="../build"
export BUNDLE_DIR="../build/bundle/programs/web.browser.legacy"
export LIVECHAT_ASSETS_DIR="../../../private/livechat"
export LATEST_LIVECHAT_VERSION="1.0.0"

cd packages/rocketchat-livechat/.app
meteor npm install --production

if [[ -z $CIRCLE_PR_NUMBER ]]; then
  meteor build --headless --directory $BUILD_DIR
else
  meteor build --headless --directory --debug $BUILD_DIR
fi;

rm -rf $LIVECHAT_DIR
mkdir -p $LIVECHAT_DIR
cp $BUNDLE_DIR/*.css $LIVECHAT_DIR/livechat.css
cp $BUNDLE_DIR/*.js $LIVECHAT_DIR/livechat.js

rm -rf $LIVECHAT_ASSETS_DIR
mkdir $LIVECHAT_ASSETS_DIR

cp $BUNDLE_DIR/head.html $LIVECHAT_ASSETS_DIR/head.html
rm -rf $BUILD_DIR

#NEW LIVECHAT#
echo "Installing new Livechat..."
cd $LIVECHAT_DIR
mkdir -p $LATEST_LIVECHAT_VERSION
cd $LATEST_LIVECHAT_VERSION

curl -sOL "https://github.com/RocketChat/Rocket.Chat.Livechat/releases/download/v${LATEST_LIVECHAT_VERSION}/build.tar.gz"
tar -xf build.tar.gz
rm build.tar.gz

# change to lowercase so all injected junk from rocket.chat is not sent: https://github.com/meteorhacks/meteor-inject-initial/blob/master/lib/inject-core.js#L10
# this is not harmful since doctype is case-insesitive: https://www.w3.org/TR/html5/syntax.html#the-doctype
ex -s -c '%s/<!DOCTYPE/<!doctype/g|x' index.html

cd $LIVECHAT_ASSETS_DIR
cp ../../public/livechat/$LATEST_LIVECHAT_VERSION/index.html .
