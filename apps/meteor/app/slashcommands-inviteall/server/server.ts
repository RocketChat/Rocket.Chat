/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */

import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IMessage, ISubscription } from '@rocket.chat/core-typings';

import { Rooms, Subscriptions, Users } from '../../models/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { api } from '../../../server/sdk/api';

function inviteAll(type: string): typeof slashCommands.commands[string]['callback'] {
	return function inviteAll(command: string, params: string, item: IMessage): void {
		if (!/invite\-all-(to|from)/.test(command)) {
			return;
		}

		let channel = params.trim();
		if (channel === '') {
			return;
		}

		channel = channel.replace('#', '');

		if (!channel) {
			return;
		}
		const userId = Meteor.userId();
		if (!userId) {
			return;
		}

		const user = Users.findOneById(userId);
		const lng = user?.language || settings.get('Language') || 'en';

		const baseChannel = type === 'to' ? Rooms.findOneById(item.rid) : Rooms.findOneByName(channel);
		const targetChannel = type === 'from' ? Rooms.findOneById(item.rid) : Rooms.findOneByName(channel);

		if (!baseChannel) {
			api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng,
				}),
			});
			return;
		}
		const cursor = Subscriptions.findByRoomIdWhenUsernameExists(baseChannel._id, {
			fields: { 'u.username': 1 },
		});

		try {
			const APIsettings = settings.get('API_User_Limit');
			if (!APIsettings) {
				return;
			}
			if (cursor.count() > APIsettings) {
				throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
					method: 'addAllToRoom',
				});
			}
			const users = cursor.fetch().map((s: ISubscription) => s.u.username);

			if (!targetChannel && ['c', 'p'].indexOf(baseChannel.t) > -1) {
				Meteor.call(baseChannel.t === 'c' ? 'createChannel' : 'createPrivateGroup', channel, users);
				api.broadcast('notify.ephemeralMessage', userId, item.rid, {
					msg: TAPi18n.__('Channel_created', {
						postProcess: 'sprintf',
						sprintf: [channel],
						lng,
					}),
				});
			} else {
				Meteor.call('addUsersToRoom', {
					rid: targetChannel._id,
					users,
				});
			}
			api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Users_added', { lng }),
			});
			return;
		} catch (e: any) {
			const msg = e.error === 'cant-invite-for-direct-room' ? 'Cannot_invite_users_to_direct_rooms' : e.error;
			api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__(msg, { lng }),
			});
		}
	};
}

slashCommands.add('invite-all-to', inviteAll('to'), {
	description: 'Invite_user_to_join_channel_all_to',
	params: '#room',
	permission: ['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'],
});
slashCommands.add('invite-all-from', inviteAll('from'), {
	description: 'Invite_user_to_join_channel_all_from',
	params: '#room',
	permission: 'add-user-to-joined-room',
});
module.exports = inviteAll;
