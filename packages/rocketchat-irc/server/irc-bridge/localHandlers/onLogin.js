export default function handleOnLogin(login) {
  if (login.user === null || this.loggedInUsers.indexOf(login.user._id) !== -1) {
    return this.log('Invalid or duplicate handleOnLogin call')
  }

  this.loggedInUsers.push(login.user._id)

  Meteor.users.update({ _id: login.user._id }, {
    $set: {
      'profile.irc.fromIRC': false,
      'profile.irc.username': `${login.user.username}-rkt`,
      'profile.irc.nick': `${login.user.username}-rkt`,
      'profile.irc.hostname': 'rocket.chat'
    }
  })

  const user = RocketChat.models.Users.findOne({
    _id: login.user._id
  })

  this.sendCommand('registerUser', user)

  const rooms = RocketChat.models.Rooms.findWithUsername(user.username).fetch()

  rooms.forEach(room => this.sendCommand('joinedChannel', { room, user }))
}
