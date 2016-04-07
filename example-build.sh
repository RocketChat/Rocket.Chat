#!/usr/bin/env bash

export METEOR_SETTINGS=$(cat settings.json)
meteor add rocketchat:hubot meteorhacks:kadira
meteor build --server https://demo.rocket.chat --directory /var/www/rocket.chat
cd /var/www/rocket.chat/bundle/programs/server
npm install
cd /var/www/rocket.chat/current
pm2 startOrRestart /var/www/rocket.chat/current/pm2.json
