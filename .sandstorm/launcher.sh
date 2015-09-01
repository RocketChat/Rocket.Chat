#!/bin/bash
set -euo pipefail

echo '** Starting mongo...'
/bin/niscud \
        --fork --port 4002 --dbpath /var --noauth --bind_ip 127.0.0.1 \
        --nohttpinterface --noprealloc --logpath /var/mongo.log &

# TODO: wait for niscu to be up
echo '** Starting Meteor...'

export MONGO_URL="mongodb://127.0.0.1:4002/meteor";
export ROOT_URL="http://127.0.0.1:8000";
export PORT="8000";

node /main.js
