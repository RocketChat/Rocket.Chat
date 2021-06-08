import { Users } from '../../../../models';

export default function handleOnCreateRoom(user, room) {
	const users = Users.findByRoomId(room._id);

	users.forEach((user) => {
		if (user.profile?.irc?.fromIRC) {
			this.sendCommand('joinChannel', { room, user });
		} else {
			this.sendCommand('joinedChannel', { room, user });
		}
	});
}
