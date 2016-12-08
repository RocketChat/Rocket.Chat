#!/bin/bash

cd `dirname $0`/..

if [ -d dist ]; then
  rm -rf dist
fi &&
npm install &&
meteor build --directory --headless --allow-superuser /tmp &&
dir=`pwd` &&
cd /tmp/bundle && 
tar --exclude=..* -czf /tmp/lookamo.chat.tar.gz * .* &&
cd $dir &&
mkdir dist &&
cp /tmp/lookamo.chat.tar.gz dist/lookamo.chat.tar.gz
