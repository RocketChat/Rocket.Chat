export default async function handleOnJoinRoom(user, room) {
	this.sendCommand('joinedChannel', { room, user });
}
