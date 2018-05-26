#!/bin/bash

mongod --fork --config /etc/mongod.conf

until mongo --eval "db" &> /dev/null; do
	echo "MongoDB still not ready, sleeping"
	sleep 1
done

node main.js
