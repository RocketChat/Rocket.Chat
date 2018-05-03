export NODE_ENV="production"
export LIVECHAT_DIR="../../../public/livechat"
export BUILD_DIR="../build"
export BUNDLE_DIR="../build/bundle/programs/web.browser"

cd packages/rocketchat-livechat/.app
# could remove `npm_config_package-lock` and `rm -f package-lock.json` when upgrade to npm 5.6 https://github.com/npm/npm/issues/17858#issuecomment-350736221
rm -f package-lock.json
env npm_config_package-lock=false meteor npm install --production
meteor build --headless --directory $BUILD_DIR

rm -rf $LIVECHAT_DIR
mkdir -p $LIVECHAT_DIR
cp $BUNDLE_DIR/*.css $LIVECHAT_DIR/livechat.css
cp $BUNDLE_DIR/*.js $LIVECHAT_DIR/livechat.js

rm -rf ../public
mkdir -p ../public
cp $BUNDLE_DIR/head.html ../public/head.html

rm -rf $BUILD_DIR
