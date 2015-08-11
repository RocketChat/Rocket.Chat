cd packages/rocketchat-external/app
meteor build .meteor/build/ --directory

mkdir -p ../public

rm -f ../public/external.css
rm -f ../public/external.js
rm -f ../public/head.html

cp .meteor/build/bundle/programs/web.browser/*.css ../public/external.css
cp .meteor/build/bundle/programs/web.browser/*.js ../public/external.js
cp .meteor/build/bundle/programs/web.browser/head.html ../public/head.html

# echo "body {background-color: red;}" > external.css

rm -rf .meteor/build/