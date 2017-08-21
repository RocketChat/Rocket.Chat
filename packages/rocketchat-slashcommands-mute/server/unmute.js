
/*
* Unmute is a named function that will replace /unmute commands
*/

RocketChat.slashCommands.add('unmute', function Unmute(command, params, item) {

	if (command !== 'unmute' || !Match.test(params, String)) {
		return;
	}
	const username = params.trim().replace('@', '');
	if (username === '') {
		return;
	}
	const user = Meteor.users.findOne(Meteor.userId());
	const unmutedUser = RocketChat.models.Users.findOneByUsername(username);
	const room = RocketChat.models.Rooms.findOneById(item.rid);
	if (unmutedUser == null) {
		return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('Username_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [username]
			}, user.language)
		});
	}
	if ((room.usernames || []).includes(username) === false) {
		return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('Username_is_not_in_this_room', {
				postProcess: 'sprintf',
				sprintf: [username]
			}, user.language)
		});
	}
	Meteor.call('unmuteUserInRoom', {
		rid: item.rid,
		username
	});
});
