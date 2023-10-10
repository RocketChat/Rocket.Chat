#!/bin/bash
echo "[#] Running yarn"
yarn
sudo yarn build
echo "[#] Building meteor project"
cd ./apps/meteor
echo " (-) removing latest bundle folder"
rm -rf ./bundle
echo " (-) cleanning tmp directory"
rm -rf /tmp/rc-build
echo " (-) running build"
meteor build --server-only /tmp/rc-build
echo " (-) unpacking files"
tar zxvf /tmp/rc-build/meteor.tar.gz
echo " (-) copying bundle to meteor project"
cp -r /tmp/rc-build/bundle/ ./bundle
echo "[#] Building Docker image"
cp ./.docker/Dockerfile.alpine ./Dockerfile
sudo docker build -t rocket .
echo "[#] Cleanning tmp directory"
rm -rf /tmp/rc-build
