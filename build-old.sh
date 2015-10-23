#!/bin/bash
source ./build-info.sh
export METEOR_SETTINGS=$(cat settings.json)
meteor add rocketchat:livechat
meteor add rocketchat:hubot
meteor add-platform ios
meteor build --server https://demo.rocket.chat --directory /var/www/rocket.chat
cd /var/www/rocket.chat/bundle/programs/server
npm install
cd /var/www/rocket.chat/current
pm2 startOrRestart /var/www/rocket.chat/current/pm2.json
