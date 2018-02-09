#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

export SANDSTORM_VERSION=$(curl -f "https://install.sandstorm.io/dev?from=0&type=install")
export PATH=$PATH:/tmp/sandstorm-$SANDSTORM_VERSION/bin

cd /tmp
curl https://dl.sandstorm.io/sandstorm-$SANDSTORM_VERSION.tar.xz | tar -xJf -

mkdir -p ~/opt
cd ~/opt
curl https://dl.sandstorm.io/meteor-spk-0.4.0.tar.xz | tar -xJf -
ln -s meteor-spk-0.4.0 meteor-spk
cp -a /bin/bash ~/opt/meteor-spk/meteor-spk.deps/bin/
cp -a /lib/x86_64-linux-gnu/libncurses.so.* ~/opt/meteor-spk/meteor-spk.deps/lib/x86_64-linux-gnu/
cp -a /lib/x86_64-linux-gnu/libtinfo.so.* ~/opt/meteor-spk/meteor-spk.deps/lib/x86_64-linux-gnu/
ln -s $CIRCLE_WORKING_DIRECTORY ~/opt/app

cd /tmp
spk init -p3000 -- nothing
export SANDSTORM_ID="$(grep '\sid =' sandstorm-pkgdef.capnp)"

cd $CIRCLE_WORKING_DIRECTORY
export METEOR_WAREHOUSE_DIR="${METEOR_WAREHOUSE_DIR:-$HOME/.meteor}"
export METEOR_DEV_BUNDLE=$(dirname $(readlink -f "$METEOR_WAREHOUSE_DIR/meteor"))/dev_bundle

mkdir -p ~/vagrant
tar -zxf /tmp/build/Rocket.Chat.tar.gz --directory ~/vagrant/
cd ~/vagrant/bundle/programs/server && "$METEOR_DEV_BUNDLE/bin/npm" install
cd $CIRCLE_WORKING_DIRECTORY/.sandstorm
sed -i "s/\sid = .*/$SANDSTORM_ID/" sandstorm-pkgdef.capnp
mkdir -p ~/vagrant/bundle/opt/app/.sandstorm/
cp ~/opt/app/.sandstorm/launcher.sh ~/vagrant/bundle/opt/app/.sandstorm/
sed -i "s/\spgp/#pgp/g" sandstorm-pkgdef.capnp
spk pack $ROCKET_DEPLOY_DIR/rocket.chat-$ARTIFACT_NAME.spk
