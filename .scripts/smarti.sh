#!/usr/bin/env bash

docker pull assisitfy/smarti:0.7.0-RC1

#docker run -d --net=host assisitfy/smarti:0.6.1

docker build -t smarti-with-stanfordnlp - < .scripts/dockerfile

docker run -d --name smarti --net=host smarti-with-stanfordnlp  --security.config.mongo.admin-password=admin --spring.data.mongodb.uri=mongodb://localhost/smarti

sleep 2m
docker ps
