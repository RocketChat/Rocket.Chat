export default async function handleUserRegistered(args) {
  // Check if there is an user with the given username
  let user = RocketChat.models.Users.findOne({
    'profile.irc.username': args.username
  })

  // If there is no user, create one...
  if (!user) {
    this.log(`Registering ${args.username} with nick: ${args.nick}`)

    const userToInsert = {
      name: args.nick,
      username: `${args.username}-irc`,
      status: 'online',
      utcOffset: 0,
      active: true,
      type: 'user',
      profile: {
        irc: {
          fromIRC: true,
          nick: args.nick,
          username: args.username,
          hostname: args.hostname
        }
      }
    }

    user = RocketChat.models.Users.create(userToInsert)
  } else {
    // ...otherwise, log the user in and update the information
    this.log(`Logging in ${args.username} with nick: ${args.nick}`)

    Meteor.users.update({ _id: user._id }, {
      $set: {
        status: 'online',
        'profile.irc.nick': args.nick,
        'profile.irc.username': args.username,
        'profile.irc.hostname': args.hostname,
      }
    })
  }
}
