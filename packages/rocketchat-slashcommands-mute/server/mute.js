
/*
* Mute is a named function that will replace /mute commands
*/

RocketChat.slashCommands.add('mute', function Mute(command, params, item) {
	if (command !== 'mute' || !Match.test(params, String)) {
		return;
	}
	const username = params.trim().replace('@', '');
	if (username === '') {
		return;
	}
	const user = Meteor.users.findOne(Meteor.userId());
	const mutedUser = RocketChat.models.Users.findOneByUsername(username);
	const room = RocketChat.models.Rooms.findOneById(item.rid);
	if (mutedUser == null) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('Username_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [username]
			}, user.language)
		});
		return;
	}
	if ((room.usernames || []).includes(username) === false) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('Username_is_not_in_this_room', {
				postProcess: 'sprintf',
				sprintf: [username]
			}, user.language)
		});
		return;
	}
	Meteor.call('muteUserInRoom', {
		rid: item.rid,
		username
	});
}, {
	description: 'Mute_someone_in_room',
	params: '@username'
});
