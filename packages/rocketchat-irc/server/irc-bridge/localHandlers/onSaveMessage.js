export default function handleOnSaveMessage(message, to) {
  let toIdentification = ''

  // Direct message
  if (to.t === 'd') {
    const recipientUser = RocketChat.models.Users.findOne({ username: _.without(to.usernames, to.username)[0] })

    toIdentification = recipientUser.profile.irc.nick
  } else {
    toIdentification = `#${to.name}`
  }

  const user = RocketChat.models.Users.findOne({ _id: message.u._id })

  this.sendCommand('sentMessage', { to: toIdentification, user, message: message.msg })
}
