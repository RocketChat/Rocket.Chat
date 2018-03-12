export default function handleJoinedChannel(args) {
  let user = RocketChat.models.Users.findOne({
    'profile.irc.nick': args.nick
  })

  if (!user) {
    throw new Error(`Could not find a user with nick ${args.nick}`)
  }

  let room = RocketChat.models.Rooms.findOneByName(args.roomName)

  if (!room) {
    const createdRoom = RocketChat.createRoom('c', args.roomName, user.username, [ /* usernames of the participants here */])
    room = RocketChat.models.Rooms.findOne({ _id: createdRoom.rid })

    this.log(`${user.username} created room ${args.roomName}`)
  } else {
    RocketChat.addUserToRoom(room._id, user)

    this.log(`${user.username} joined room ${room.name}`)
  }
}
