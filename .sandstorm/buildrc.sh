#!/bin/bash

set -euo pipefail

cd /tmp
spk init -p3000 -- nothing
export SANDSTORM_ID="$(grep '\sid =' sandstorm-pkgdef.capnp)"
cd $TRAVIS_BUILD_DIR
export METEOR_WAREHOUSE_DIR="${METEOR_WAREHOUSE_DIR:-$HOME/.meteor}"
export METEOR_DEV_BUNDLE=$(dirname $(readlink -f "$METEOR_WAREHOUSE_DIR/meteor"))/dev_bundle
cd /home/vagrant  &&  tar zxf ./Rocket.Chat.tar.gz
rm ./Rocket.Chat.tar.gz
cd /home/vagrant/bundle/programs/server && "$METEOR_DEV_BUNDLE/bin/npm" install
cd $TRAVIS_BUILD_DIR/.sandstorm
sed -i "s/\sid = .*/$SANDSTORM_ID/" sandstorm-pkgdef.capnp
mkdir -p /home/vagrant/bundle/opt/app/.sandstorm/
cp /opt/app/.sandstorm/launcher.sh /home/vagrant/bundle/opt/app/.sandstorm/
sed -i "s/\spgp/#pgp/g" sandstorm-pkgdef.capnp
spk pack $TRAVIS_BUILD_DIR/rocket.chat.latest.spk
