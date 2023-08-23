import { Rooms, Users } from '@rocket.chat/models';

export default async function handleOnLogin(login) {
	if (login.user === null) {
		return this.log('Invalid handleOnLogin call');
	}
	if (!login.user.username) {
		return this.log('Invalid handleOnLogin call (Missing username)');
	}
	if (this.loggedInUsers.indexOf(login.user._id) !== -1) {
		return this.log('Duplicate handleOnLogin call');
	}

	this.loggedInUsers.push(login.user._id);

	await Users.updateOne(
		{ _id: login.user._id },
		{
			$set: {
				'profile.irc.fromIRC': false,
				'profile.irc.username': `${login.user.username}-rkt`,
				'profile.irc.nick': `${login.user.username}-rkt`,
				'profile.irc.hostname': 'rocket.chat',
			},
		},
	);

	const user = await Users.findOne({
		_id: login.user._id,
	});

	this.sendCommand('registerUser', user);
	const rooms = await Rooms.findBySubscriptionUserId(user._id).toArray();

	rooms.forEach((room) => {
		if (room.t === 'd') {
			return;
		}

		this.sendCommand('joinedChannel', { room, user });
	});
}
