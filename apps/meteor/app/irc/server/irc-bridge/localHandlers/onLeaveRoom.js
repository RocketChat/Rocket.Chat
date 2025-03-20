export default async function handleOnLeaveRoom(user, room) {
	this.sendCommand('leftChannel', { room, user });
}
