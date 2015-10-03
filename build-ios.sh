#!/bin/bash

meteor add-platform ios
rm -rf .meteor/local/cordova-build
rm -rf ../Rocket.Chat-build
meteor build ../Rocket.Chat-build --server https://demo.rocket.chat
sed -i '' 's/IPHONEOS_DEPLOYMENT_TARGET[[:space:]]=[[:space:]]6\.0/IPHONEOS_DEPLOYMENT_TARGET = 8\.0/g' .meteor/local/cordova-build/platforms/ios/Rocket.Chat.xcodeproj/project.pbxproj

# Set some plist attr for new xcode compile
/usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity dict" .meteor/local/cordova-build/platforms/ios/Rocket.Chat/Rocket.Chat-Info.plist
/usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool YES" .meteor/local/cordova-build/platforms/ios/Rocket.Chat/Rocket.Chat-Info.plist
/usr/libexec/PlistBuddy -c "Add :LSApplicationQueriesSchemes array" .meteor/local/cordova-build/platforms/ios/Rocket.Chat/Rocket.Chat-Info.plist
/usr/libexec/PlistBuddy -c "Add :LSApplicationQueriesSchemes:0 string 'fbauth'" .meteor/local/cordova-build/platforms/ios/Rocket.Chat/Rocket.Chat-Info.plist

# Set buildnumber as cur date in seconds
DATE=$(date +%s)
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $DATE" .meteor/local/cordova-build/platforms/ios/Rocket.Chat/Rocket.Chat-Info.plist

open .meteor/local/cordova-build/platforms/ios/Rocket.Chat.xcodeproj
echo '- Change provisioning profiles'
echo '- Convert icons to use Asset Catalog'
echo '- Add more icons'
echo '- Add more splashs'
