export default function handleOnLogout(user) {
  this.loggedInUsers = _.without(this.loggedInUsers, user._id)

  this.sendCommand('disconnected', { user })
}
