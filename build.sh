#!/bin/bash

if [ ! $1 ]; then
	echo " Example of use: source build.sh production"
fi

if [ $1 ]; then
	source ./build-info.sh
	export METEOR_SETTINGS=$(cat settings.$1.json)
	meteor add rocketchat:external
	meteor add rocketchat:hubot
	meteor build --server https://demo.rocket.chat --directory /var/www/rocket.chat
	cd /var/www/rocket.chat/bundle/programs/server
	npm install
	cd /var/www/rocket.chat/current
	pm2 startOrRestart /var/www/rocket.chat/current/pm2.$1.json
fi
