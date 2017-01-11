#!/bin/bash

MONGO_PATH="/app/.meteor/heroku_build/app/programs/server/npm/node_modules/meteor/npm-mongo"
AVATARS_PATH="/app/uploads"

mkdir -p ${AVATARS_PATH}
cd ${MONGO_PATH}

cat > printUsernames.js << EOF
var MongoClient = require('mongodb').MongoClient

function run(args) {
  if (!args[0]) {
    console.error('Usage: syncAvatars MONGODB_URL')
    process.exit(1)
  }

  try {
    MongoClient.connect(args[0], function(err, db) {
      if (err) {
        throw err
      }
      var results = db.collection('users').find({}, {username: true})
      results.forEach(
        function(user) {
          console.log(user.username)
        },
        function(err) {
          if (err) {
            throw err
          }
          db.close()
          process.exit(0)
        }
      )
    })
  } catch (err) {
    console.error(err.stack)
    process.exit(1)
  }
}

if (!module.parent) {
  run(process.argv.slice(2))
}
EOF

node printUsernames.js ${MONGO_URL} | xargs -I {} curl -sLo ${AVATARS_PATH}/{}.png https://github.com/{}.png?size=200
rm printUsernames.js
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
