@echo off

cd packages/rocketchat-livechat/app
call meteor build .meteor/build/ --directory

cd ..
mkdir public

del /q "public/livechat.css"
del /q "public/livechat.js"
del /q "public/head.html"

cd "app/.meteor/build/bundle/programs/web.browser/"
xcopy /y "*.css" "../../../../../../public/livechat.css*"
xcopy /y "*.js" "../../../../../../public/livechat.js*"
xcopy /y "head.html" "../../../../../../public/head.html*"

::echo "body {background-color: red;}" > livechat.css

cd "../../../../../.."

rmdir /s /q "app/.meteor/build/"
