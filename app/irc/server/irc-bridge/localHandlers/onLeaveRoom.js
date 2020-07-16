export default function handleOnLeaveRoom(user, room) {
	this.sendCommand('leftChannel', { room, user });
}
