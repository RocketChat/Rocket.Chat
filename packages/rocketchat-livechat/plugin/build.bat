@echo off

cd packages/rocketchat-livechat/app
meteor build .meteor/build/ --directory

cd ..
mkdir public

rm -f public/livechat.css
rm -f public/livechat.js
rm -f public/head.html

cp app/.meteor/build/bundle/programs/web.browser/*.css public/livechat.css
cp app/.meteor/build/bundle/programs/web.browser/*.js public/livechat.js
cp app/.meteor/build/bundle/programs/web.browser/head.html public/head.html

::echo "body {background-color: red;}" > livechat.css

rm -rf app/.meteor/build/
