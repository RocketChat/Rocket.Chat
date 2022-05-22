import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { IMessage } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { Subscriptions } from '../../models/server';
import { api } from '../../../server/sdk/api';

/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */

function Invite(_command: 'invite', params: string, item: IMessage): void {
	const usernames = params
		.split(/[\s,]/)
		.map((username) => username.replace(/(^@)|( @)/, ''))
		.filter((a) => a !== '');
	if (usernames.length === 0) {
		return;
	}
	const users = Meteor.users.find({
		username: {
			$in: usernames,
		},
	});
	const userId = Meteor.userId() as string;
	if (users.count() === 0) {
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('User_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [usernames.join(' @')],
				lng: settings.get('Language') || 'en',
			}),
		});
		return;
	}
	const usersFiltered = users.fetch().filter(function (user) {
		const subscription = Subscriptions.findOneByRoomIdAndUserId(item.rid, user._id, {
			fields: { _id: 1 },
		});
		if (subscription == null) {
			return true;
		}
		const usernameStr = user.username as string;
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Username_is_already_in_here', {
				postProcess: 'sprintf',
				sprintf: [usernameStr],
				lng: settings.get('Language') || 'en',
			}),
		});
		return false;
	});

	usersFiltered.forEach(function (user) {
		try {
			return Meteor.call('addUserToRoom', {
				rid: item.rid,
				username: user.username,
			});
		} catch ({ error }) {
			if (typeof error !== 'string') {
				return;
			}
			if (error === 'cant-invite-for-direct-room') {
				api.broadcast('notify.ephemeralMessage', userId, item.rid, {
					msg: TAPi18n.__('Cannot_invite_users_to_direct_rooms', { lng: settings.get('Language') || 'en' }),
				});
			} else {
				api.broadcast('notify.ephemeralMessage', userId, item.rid, {
					msg: TAPi18n.__(error, { lng: settings.get('Language') || 'en' }),
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
