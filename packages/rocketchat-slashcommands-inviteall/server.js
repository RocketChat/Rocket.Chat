/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */
function InviteAll(command, params, item) {
	if (command !== 'invite-all' || !Match.test(params, String)) {
		return;
	}
	let regexp = /#([\d-_\w]+)/g;
	let [, channel] = regexp.exec(params.trim());
	if (!channel) {
		return;
	}
	let users = RocketChat.models.Rooms.findOneById(item.rid).usernames || [];
	let currentUser = Meteor.users.findOne(Meteor.userId());

	if (users.length > RocketChat.settings.get('API_User_Limit')) {
    return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('error-user-limit-exceeded', null, currentUser.language)
    });		
	}

	let room = RocketChat.models.Rooms.findOneByName(channel);
	if (!room) {
		return Meteor.call('createChannel', channel, users);
	}

	users.forEach(function(user) {
		try {
			Meteor.call('addUserToRoom', {
				rid: room._id,
				username: user
			});
		} catch (e) {
			let msg = e.error === 'cant-invite-for-direct-room' ? 'Cannot_invite_users_to_direct_rooms' : e.error;
			RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date(),
				msg: TAPi18n.__(msg, null, currentUser.language)
			});
		}
	});
}

RocketChat.slashCommands.add('invite-all', InviteAll);
module.exports = InviteAll;