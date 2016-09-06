cd packages/rocketchat-livechat/app
meteor build .meteor/build/ --directory

mkdir -p ../public

rm -rf ../public/*

cp .meteor/build/bundle/programs/web.browser/*.css ../public/livechat.css
cp .meteor/build/bundle/programs/web.browser/*.js ../public/livechat.jsi
cp .meteor/build/bundle/programs/web.browser/head.html ../public/head.html

# echo "body {background-color: red;}" > livechat.css

rm -rf .meteor/build/
