
/*
* Invite is a named function that will replace /invite commands
* @param {Object} message - The message object
*/


function Invite(command, params, item) {

	if (command !== 'invite' || !Match.test(params, String)) {
		return;
	}
	let usernames = params.replace(/@/g, '').split(/[\s,]/).filter((a) => a !== '');
	if (usernames.length === 0) {
		return;
	}
	const users = Meteor.users.find({
		username: {
			$in: usernames
		}
	});
	const currentUser = Meteor.users.findOne(Meteor.userId());
	if (users.count() === 0) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('User_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [usernames.join(' @')]
			}, currentUser.language)
		});
		return;
	}
	usernames = usernames.filter(function(username) {
		if (RocketChat.models.Rooms.findOneByIdContainingUsername(item.rid, username) == null) {
			return true;
		}
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('Username_is_already_in_here', {
				postProcess: 'sprintf',
				sprintf: [username]
			}, currentUser.language)
		});
		return false;
	});
	if (usernames.length === 0) {
		return;
	}
	users.forEach(function(user) {

		try {
			return Meteor.call('addUserToRoom', {
				rid: item.rid,
				username: user.username
			});
		} catch ({error}) {
			if (error === 'cant-invite-for-direct-room') {
				RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
					_id: Random.id(),
					rid: item.rid,
					ts: new Date,
					msg: TAPi18n.__('Cannot_invite_users_to_direct_rooms', null, currentUser.language)
				});
			} else {
				RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
					_id: Random.id(),
					rid: item.rid,
					ts: new Date,
					msg: TAPi18n.__(error, null, currentUser.language)
				});
			}
		}
	});
}

RocketChat.slashCommands.add('invite', Invite);

export {Invite};
