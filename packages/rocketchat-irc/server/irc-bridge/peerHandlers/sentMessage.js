export default function handleSentMessage(args) {
  let user = RocketChat.models.Users.findOne({
    'profile.irc.nick': args.nick
  })

  if (!user) {
    throw new Error(`Could not find a user with nick ${args.nick}`)
  }

  let room

  if (args.roomName) {
    room = RocketChat.models.Rooms.findOneByName(args.roomName)
  } else {
    const recipientUser =  RocketChat.models.Users.findOne({
      'profile.irc.nick': args.recipientNick
    })

    room = getDirectRoom(user, recipientUser)
  }

  const message = {
    msg: args.message,
    ts: new Date()
  }

  RocketChat.sendMessage(user, message, room)
}

/*
 *
 * Get direct chat room helper
 *
 *
 */
const getDirectRoom = (source, target) => {
  const rid = [ source._id, target._id ].sort().join('')

  RocketChat.models.Rooms.upsert({ _id: rid }, {
    $set: {
      usernames: [source.username, target.username]
    },
    $setOnInsert: {
      t: 'd',
      msgs: 0,
      ts: new Date()
    }
  })

  RocketChat.models.Subscriptions.upsert({rid, 'u._id': target._id}, {
    $setOnInsert: {
      name: source.username,
      t: 'd',
      open: false,
      alert: false,
      unread: 0,
      u: {
        _id: target._id,
        username: target.username
      }
    }
  })

  return {
    _id: rid,
    t: 'd'
  }
}
