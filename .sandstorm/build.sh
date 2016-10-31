#!/bin/bash
set -x
set -euvo pipefail

# Make meteor bundle
export NODE_ENV=production
cd /opt/app
meteor npm install --production
meteor build --directory /home/vagrant/
cd /home/vagrant/bundle/programs/server
sudo meteor npm install --production

# Copy our launcher script into the bundle so the grain can start up.
mkdir -p /home/vagrant/bundle/opt/app/.sandstorm/
cp /opt/app/.sandstorm/launcher.sh /home/vagrant/bundle/opt/app/.sandstorm/
