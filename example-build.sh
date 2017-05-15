#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

# Build
export NODE_ENV=production
meteor add rocketchat:internal-hubot meteorhacks:kadira
meteor build --server https://demo.rocket.chat --directory /var/www/rocket.chat

# Run
export METEOR_SETTINGS=$(cat settings.json)
cd /var/www/rocket.chat/bundle/programs/server
npm install
cd /var/www/rocket.chat/current
pm2 startOrRestart /var/www/rocket.chat/current/pm2.json
