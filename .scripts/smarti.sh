#!/usr/bin/env bash

docker pull thomasroehl/smarti:firsttry

docker run -d --net=host thomasroehl/smarti:firsttry

sleep 2m
docker ps

curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{"defaultClient": true, "description": "", "name": "testclient"}' 'http://localhost:8080/client' > out.json
x=$(grep -Eo '"id":.*?[^\\]",' out.json)
x=${x:6:25}

curl -X POST --header 'Content-Type: application/json' --header 'Accept: text/plain' -d '{"queryBuilder":[{"_class":"io.redlink.smarti.model.config.ComponentConfiguration","name":"conversationmlt","displayName":"conversationmlt","type":"conversationmlt","enabled":true,"unbound":false,"pageSize":3,"filter":["support_area"]},{"_class":"io.redlink.smarti.model.config.ComponentConfiguration","name":"conversationsearch","displayName":"conversationsearch","type":"conversationsearch","enabled":true,"unbound":false,"pageSize":3,"filter":["support_area"]}]}' 'http://localhost:8080/client/${x}/config'
