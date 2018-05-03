#!/usr/bin/env bash

if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  sh -e /etc/init.d/xvfb start
  sleep 3
fi
