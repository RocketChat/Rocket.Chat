#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

# Requies Node.js version 4.x
# Do not run as root

DEPLOY_DIR=.docker

### BUILD
meteor npm install

# on the very first build, meteor build command should fail due to a bug on emojione package (related to phantomjs installation)
# the command below forces the error to happen before build command (not needed on subsequent builds)
set +e
meteor add rocketchat:lib
set -e

meteor build --server-only --directory $DEPLOY_DIR

sudo docker build -t rocket .docker/
