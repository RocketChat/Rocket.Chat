import { RocketChat } from 'meteor/rocketchat:lib';

export default function handleOnCreateRoom(user, room) {
	const users = RocketChat.models.Users.findByRoomId(room._id);

	users.forEach((user) => {
		if (user.profile.irc.fromIRC) {
			this.sendCommand('joinChannel', { room, user });
		} else {
			this.sendCommand('joinedChannel', { room, user });
		}
	});
}
