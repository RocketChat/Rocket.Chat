@echo off

cd packages/rocketchat-livechat/app
call meteor npm install
call meteor build --directory .meteor/build/

SET LIVECHAT_DIR="../../../public/livechat"
SET BUILD_DIR=".meteor/build/bundle/programs/web.browser"

mkdir ..\public
del /q /s ..\public\*

rmdir /q /s %LIVECHAT_DIR%
mkdir %LIVECHAT_DIR%

xcopy /y %BUILD_DIR%\*.css %LIVECHAT_DIR%\livechat.css*
xcopy /y %BUILD_DIR%\*.js %LIVECHAT_DIR%\livechat.js*
xcopy /y /s /e /i %BUILD_DIR%\app\* %LIVECHAT_DIR%\*
xcopy /y %BUILD_DIR%\head.html ..\public\head.html*

rmdir /s /q .meteor\build\
