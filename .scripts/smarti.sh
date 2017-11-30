#!/usr/bin/env bash

docker pull thomasroehl/smarti:firsttry

docker run -d --net=host thomasroehl/smarti:firsttry
