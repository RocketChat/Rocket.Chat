#!/bin/bash

rm -rf .meteor/local/cordova-build
rm -rf ../Rocket.Chat-build
meteor build ../Rocket.Chat-build --server https://rocket.chat
open .meteor/local/cordova-build/platforms/ios/Rocket.Chat.xcodeproj