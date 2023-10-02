import { Rooms, Users } from '@rocket.chat/models';

export default async function handleOnCreateUser(newUser) {
	if (!newUser) {
		return this.log('Invalid handleOnCreateUser call');
	}
	if (!newUser.username) {
		return this.log('Invalid handleOnCreateUser call (Missing username)');
	}
	if (this.loggedInUsers.indexOf(newUser._id) !== -1) {
		return this.log('Duplicate handleOnCreateUser call');
	}

	this.loggedInUsers.push(newUser._id);

	await Users.updateOne(
		{ _id: newUser._id },
		{
			$set: {
				'profile.irc.fromIRC': false,
				'profile.irc.username': `${newUser.username}-rkt`,
				'profile.irc.nick': `${newUser.username}-rkt`,
				'profile.irc.hostname': 'rocket.chat',
			},
		},
	);

	const user = await Users.findOne({
		_id: newUser._id,
	});

	this.sendCommand('registerUser', user);

	const rooms = await Rooms.findBySubscriptionUserId(user._id).toArray();

	rooms.forEach((room) => this.sendCommand('joinedChannel', { room, user }));
}
