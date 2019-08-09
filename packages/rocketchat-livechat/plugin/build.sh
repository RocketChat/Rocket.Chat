# set -x
export NODE_ENV="production"
export LIVECHAT_DIR="./public/livechat"
export LIVECHAT_ASSETS_DIR="./private/livechat"

ROOT=$(pwd)

rm -rf $LIVECHAT_DIR
mkdir -p $LIVECHAT_DIR

rm -rf $LIVECHAT_ASSETS_DIR
mkdir $LIVECHAT_ASSETS_DIR

#NEW LIVECHAT#
echo "Installing new Livechat..."
cd $LIVECHAT_DIR

cp -a $ROOT/node_modules/\@rocket.chat/livechat/build/. ./
# change to lowercase so all injected junk from rocket.chat is not sent: https://github.com/meteorhacks/meteor-inject-initial/blob/master/lib/inject-core.js#L10
# this is not harmful since doctype is case-insesitive: https://www.w3.org/TR/html5/syntax.html#the-doctype
node -e 'fs.writeFileSync("index.html", fs.readFileSync("index.html").toString().replace("<!DOCTYPE", "<!doctype"));'
cd $ROOT/$LIVECHAT_ASSETS_DIR
cp ../../public/livechat/index.html .
