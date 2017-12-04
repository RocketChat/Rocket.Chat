#!/usr/bin/env bash

docker pull thomasroehl/smarti:redlink

#docker run -d --net=host thomasroehl/smarti:firsttry

docker build -t smarti-with-stanfordnlp - < .scripts/dockerfile

docker run -d --name smarti --net=host smarti-with-stanfordnlp  --security.password=admin --spring.data.mongodb.uri=mongodb://localhost/smarti --security.enabled=false

sleep 2m
docker ps
