export default function handleOnJoinRoom(user, room) {
  this.sendCommand('joinedChannel', { room, user })
}
