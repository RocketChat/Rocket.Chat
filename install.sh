#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

ROOTPATH=/var/www/rocket.chat
PM2FILE=pm2.json
if [ "$1" == "development" ]; then
  ROOTPATH=/var/www/rocket.chat.dev
  PM2FILE=pm2.dev.json
fi

cd $ROOTPATH
gpg --keyserver ha.pool.sks-keyservers.net --recv-keys 0E163286C20D07B9787EBE9FD7F9D0414FD08104

curl -SLf "https://releases.rocket.chat/latest/download/" -o rocket.chat.tgz
curl -SLf "https://releases.rocket.chat/latest/asc" -o rocket.chat.tgz.asc \

gpg --verify rocket.chat.tgz.asc
if [ $? -eq 0 ]; then
    echo "Verified download integrity"
else
    echo "Invalid file, download corrupted or incomplete"
    exit 1
fi

tar zxf rocket.chat.tgz  &&  rm rocket.chat.tgz rocket.chat.tgz.asc
cd $ROOTPATH/bundle/programs/server
npm install
pm2 startOrRestart $ROOTPATH/current/$PM2FILE
