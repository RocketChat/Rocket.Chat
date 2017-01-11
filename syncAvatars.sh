#!/bin/bash

MONGO_PATH="/app/.meteor/heroku_build/app/programs/server/npm/node_modules/meteor/npm-mongo"
AVATARS_PATH="/app/uploads"

mkdir -p ${AVATARS_PATH}
cd ${MONGO_PATH}
cp /app/printUsernames.js .
node printUsernames.js ${MONGO_URL} | xargs -I {} curl -sLo ${AVATARS_PATH}/{}.png https://github.com/{}.png?size=200
cd ${AVATARS_PATH}
for f in *.png; do
  jpg=$(echo $f | sed "s/\.png$/.jpg/")
  type=$(file -b ${f} | cut -d' ' -f1)
  echo $f $jpg $type
  test "${type}" = "ASCII" && rm ${f} && continue
  test "${type}" = "PNG" && convert ${f} ${jpg} && rm ${f} && continue
  test "${type}" = "JPEG" && mv ${f} ${jpg}
done
cd /app
