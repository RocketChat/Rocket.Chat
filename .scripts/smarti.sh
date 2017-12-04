#!/usr/bin/env bash

docker pull thomasroehl/smarti:redlink

#docker run -d --net=host thomasroehl/smarti:firsttry

ls

ls /tmp/build/
docker build -t smarti-with-stanfordnlp - < .scripts/dockerfile

docker run -d --name smarti --net=host smarti-with-stanfordnlp  --security.password=admin

docker ps
