#!/bin/bash

rm -rf .meteor/local/cordova-build
rm -rf ../Rocket.Chat-build
meteor build ../Rocket.Chat-build --server https://demo.rocket.chat
sed -i '' 's/IPHONEOS_DEPLOYMENT_TARGET[[:space:]]=[[:space:]]6\.0/IPHONEOS_DEPLOYMENT_TARGET = 7\.0/g' .meteor/local/cordova-build/platforms/ios/Rocket.Chat.xcodeproj/project.pbxproj
open .meteor/local/cordova-build/platforms/ios/Rocket.Chat.xcodeproj
