#!/bin/bash

meteor build ../Rocket.Chat-build --server https://demo.rocket.chat
jarsigner -digestalg SHA1 .meteor/local/cordova-build/platforms/android/ant-build/CordovaApp-release-unsigned.apk RocketChat
~/.meteor/android_bundle/android-sdk/build-tools/21.0.0/zipalign 4 .meteor/local/cordova-build/platforms/android/ant-build/CordovaApp-release-unsigned.apk .meteor/local/cordova-build/platforms/android/ant-build/RocketChat-release-signed.apk
open .meteor/local/cordova-build/platforms/android/ant-build/
