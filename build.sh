#!/bin/bash
cd /var/www/rocket.chat
curl -fSL "https://s3.amazonaws.com/rocketchatbuild/demo.rocket.chat-v.latest.tgz" -o rocket.chat.tgz
tar zxvf rocket.chat.tgz  &&  rm rocket.chat.tgz
cd /var/www/rocket.chat/bundle/programs/server
npm install
cd /var/www/rocket.chat/current
pm2 startOrRestart /var/www/rocket.chat/current/pm2.json
