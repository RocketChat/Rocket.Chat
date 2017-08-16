
/*
* Join is a named function that will replace /join commands
* @param {Object} message - The message object
*/


RocketChat.slashCommands.add('join', function Join(command, params, item) {

	if (command !== 'join' || !Match.test(params, String)) {
		return;
	}
	let channel = params.trim();
	if (channel === '') {
		return;
	}
	channel = channel.replace('#', '');
	const user = Meteor.users.findOne(Meteor.userId());
	const room = RocketChat.models.Rooms.findOneByNameAndType(channel, 'c');
	if (!room) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('Channel_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language)
		});
	}
	if (room.usernames.includes(user.username)) {
		throw new Meteor.Error('error-user-already-in-room', 'You are already in the channel', {
			method: 'slashCommands'
		});
	}
	Meteor.call('joinRoom', room._id);
}, {
	description: 'Join_the_given_channel',
	params: '#channel'
});
