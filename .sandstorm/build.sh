#!/bin/bash
set -x
set -euvo pipefail

# Make meteor bundle

METEOR_WAREHOUSE_DIR="${METEOR_WAREHOUSE_DIR:-$HOME/.meteor}"
METEOR_DEV_BUNDLE=$(dirname $(readlink -f "$METEOR_WAREHOUSE_DIR/meteor"))/dev_bundle

cd ~/opt/app
meteor build --directory ~/vagrant/
(cd ~/vagrant/bundle/programs/server && "$METEOR_DEV_BUNDLE/bin/npm" install)

# Copy our launcher script into the bundle so the grain can start up.
mkdir -p ~/vagrant/bundle/opt/app/.sandstorm/
cp ~/opt/app/.sandstorm/launcher.sh ~/vagrant/bundle/opt/app/.sandstorm/
