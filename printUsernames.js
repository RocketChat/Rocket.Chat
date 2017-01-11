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
