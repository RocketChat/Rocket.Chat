/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */

function inviteAll(type) {

	return function inviteAll(command, params, item) {
		// if (/invite\-all/.test(command) || !Match.test(params, String)) {
		// 	return;
		// }
		let regexp = /#([\d-_\w]+)/g,
			[, channel] = regexp.exec(params.trim());

		if (!channel) {
			return;
		}

		let currentUser = Meteor.users.findOne(Meteor.userId());
		let baseChannel = type === 'to' ? RocketChat.models.Rooms.findOneById(item.rid) : RocketChat.models.Rooms.findOneByName(channel);
		let targetChannel = type === 'from' ? RocketChat.models.Rooms.findOneById(item.rid) : RocketChat.models.Rooms.findOneByName(channel);

		if (!baseChannel) {
			return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date(),
				msg: TAPi18n.__('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, currentUser.language)
			});
		}

		let users = baseChannel.usernames || [];

		if (users.length > RocketChat.settings.get('API_User_Limit')) {
			return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date(),
				msg: TAPi18n.__('error-user-limit-exceeded', null, currentUser.language)
			});
		}

		if (!targetChannel) {
			return Meteor.call('createChannel', channel, users);
		}

		users.forEach(function(user) {
			try {
				Meteor.call('addUserToRoom', {
					rid: targetChannel._id,
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
	};
}

RocketChat.slashCommands.add('invite-all-to', inviteAll('to'));
RocketChat.slashCommands.add('invite-all-from', inviteAll('from'));
module.exports = inviteAll;