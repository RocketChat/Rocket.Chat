export default function handleQUIT(args) {
  let user = RocketChat.models.Users.findOne({
    'profile.irc.nick': args.nick
  })

  Meteor.users.update({ _id: user._id }, {
    $set: {
      status: 'offline'
    }
  })

  RocketChat.models.Rooms.removeUsernameFromAll(user.username)
}
