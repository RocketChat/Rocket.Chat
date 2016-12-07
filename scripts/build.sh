#!/bin/bash

cd `dirname $0`/..

if [ -d dist ]; then
  rm -rf dist
fi &&
npm install &&
meteor build --headless /tmp &&
ls -Al /tmp &&
tar --exclude=..* -czf /tmp/lookamo.com.tar.gz * .* &&
mkdir dist &&
cp /tmp/lookamo.com.tar.gz dist/lookamo.com.tar.gz
