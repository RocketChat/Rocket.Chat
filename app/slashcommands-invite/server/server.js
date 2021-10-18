import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { slashCommands } from '../../utils';
import { Subscriptions } from '../../models';
import { api } from '../../../server/sdk/api';

/*
* Invite is a named function that will replace /invite commands
* @param {Object} message - The message object
*/


function Invite(command, params, item) {
	if (command !== 'invite' || !Match.test(params, String)) {
		return;
	}

	const usernames = params.split(/[\s,]/).map((username) => username.replace(/(^@)|( @)/, '')).filter((a) => a !== '');
	if (usernames.length === 0) {
		return;
	}
	let users = Meteor.users.find({
		username: {
			$in: usernames,
		},
	});
	const userId = Meteor.userId();
	const currentUser = Meteor.users.findOne(userId);
	if (users.count() === 0) {
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('User_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [usernames.join(' @')],
			}, currentUser.language),
		});
		return;
	}
	users = users.fetch().filter(function(user) {
		const subscription = Subscriptions.findOneByRoomIdAndUserId(item.rid, user._id, { fields: { _id: 1 } });
		if (subscription == null) {
			return true;
		}
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Username_is_already_in_here', {
				postProcess: 'sprintf',
				sprintf: [user.username],
			}, currentUser.language),
		});
		return false;
	});

	users.forEach(function(user) {
		try {
			return Meteor.call('addUserToRoom', {
				rid: item.rid,
				username: user.username,
			});
		} catch ({ error }) {
			if (error === 'cant-invite-for-direct-room') {
				api.broadcast('notify.ephemeralMessage', userId, item.rid, {
					msg: TAPi18n.__('Cannot_invite_users_to_direct_rooms', null, currentUser.language),
				});
			} else {
				api.broadcast('notify.ephemeralMessage', userId, item.rid, {
					msg: TAPi18n.__(error, null, currentUser.language),
				});
			}
		}
	});
}

slashCommands.add('invite', Invite, {
	description: 'Invite_user_to_join_channel',
	params: '@username',
	permission: 'add-user-to-joined-room',
});
