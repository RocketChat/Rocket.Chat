export default function handleOnCreateRoom(user, room) {
  if (!room.usernames) {
    return this.log(`Room ${room.name} does not have a valid list of usernames`)
  }

  for (const username of room.usernames) {
    const user = RocketChat.models.Users.findOne({ username })

    if (user.profile.irc.fromIRC) {
      this.sendCommand('joinChannel', { room, user })
    } else {
      this.sendCommand('joinedChannel', { room, user })
    }
  }
}
