set -x
export NODE_ENV="production"
export LIVECHAT_DIR="./public/livechat"
export LIVECHAT_ASSETS_DIR="./private/livechat"
export LIVECHAT_VERSION="1.1.1"

ROOT=$(pwd)

rm -rf $LIVECHAT_DIR
mkdir -p $LIVECHAT_DIR

rm -rf $LIVECHAT_ASSETS_DIR
mkdir $LIVECHAT_ASSETS_DIR

#NEW LIVECHAT#
echo "Installing new Livechat..."
cd $LIVECHAT_DIR

RELEASE_URL="https://github.com/RocketChat/Rocket.Chat.Livechat/releases/download/v${LIVECHAT_VERSION}/build.tar.gz"

curl -sLO $RELEASE_URL
tar -xzf build.tar.gz
rm build.tar.gz

# change to lowercase so all injected junk from rocket.chat is not sent: https://github.com/meteorhacks/meteor-inject-initial/blob/master/lib/inject-core.js#L10
# this is not harmful since doctype is case-insesitive: https://www.w3.org/TR/html5/syntax.html#the-doctype
node -e 'fs.writeFileSync("index.html", fs.readFileSync("index.html").toString().replace("<!DOCTYPE", "<!doctype"));'
cd $ROOT/$LIVECHAT_ASSETS_DIR
cp ../../public/livechat/index.html .
