#!/bin/bash

if [ ! $1 ]; then
	echo " Example of use: source build.sh production"
fi

if [ $1 ]; then
	source ./build-info.sh
	export METEOR_SETTINGS=$(cat settings.$1.json)
	meteor add rocketchat:external
	meteor add rocketchat:hubot
	meteor build --server chat-locker --directory /var/www/chat-locker
	cd /var/www/chat-locker/bundle/programs/server
	npm install
	cd /var/www/chat-locker/current
	pm2 startOrRestart /var/www/chat-locker/current/pm2.$1.json
fi
