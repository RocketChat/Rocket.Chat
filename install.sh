#!/usr/bin/env bash

ROOTPATH=/var/www/rocket.chat
PM2FILE=pm2.json
if [ "$1" == "development" ]; then
  ROOTPATH=/var/www/rocket.chat.dev
  PM2FILE=pm2.dev.json
fi

cd $ROOTPATH
curl -fSL "https://s3.amazonaws.com/rocketchatbuild/rocket.chat-develop.tgz" -o rocket.chat.tgz
tar zxf rocket.chat.tgz  &&  rm rocket.chat.tgz
cd $ROOTPATH/bundle/programs/server
npm install
pm2 startOrRestart $ROOTPATH/current/$PM2FILE
