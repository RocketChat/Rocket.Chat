export default function handleLeftChannel(args) {
  let user = RocketChat.models.Users.findOne({
    'profile.irc.nick': args.nick
  })

  if (!user) {
    throw new Error(`Could not find a user with nick ${args.nick}`)
  }

  let room = RocketChat.models.Rooms.findOneByName(args.roomName)

  if (!room) {
    throw new Error(`Could not find a room with name ${args.roomName}`)
  }

  this.log(`${user.username} left room ${room.name}`)
  RocketChat.removeUserFromRoom(room._id, user)
}
