/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */

import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { ISubscription, SlashCommand } from '@rocket.chat/core-typings';
import { api } from '@rocket.chat/core-services';
import { Subscriptions, Rooms } from '@rocket.chat/models';

import { Users } from '../../models/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';

function inviteAll<T extends string>(type: T): SlashCommand<T>['callback'] {
	return async function inviteAll(command: T, params: string, item): Promise<void> {
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

		const baseChannel = type === 'to' ? await Rooms.findOneById(item.rid) : await Rooms.findOneByName(channel);
		const targetChannel = type === 'from' ? await Rooms.findOneById(item.rid) : await Rooms.findOneByName(channel);

		if (!baseChannel) {
			void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng,
				}),
			});
			return;
		}
		const cursor = Subscriptions.findByRoomIdWhenUsernameExists(baseChannel._id, {
			projection: { 'u.username': 1 },
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
			const users = (await cursor.toArray()).map((s: ISubscription) => s.u.username);

			if (!targetChannel && ['c', 'p'].indexOf(baseChannel.t) > -1) {
				await Meteor.callAsync(baseChannel.t === 'c' ? 'createChannel' : 'createPrivateGroup', channel, users);
				void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
					msg: TAPi18n.__('Channel_created', {
						postProcess: 'sprintf',
						sprintf: [channel],
						lng,
					}),
				});
			} else {
				await Meteor.callAsync('addUsersToRoom', {
					rid: targetChannel._id,
					users,
				});
			}
			void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Users_added', { lng }),
			});
			return;
		} catch (e: any) {
			const msg = e.error === 'cant-invite-for-direct-room' ? 'Cannot_invite_users_to_direct_rooms' : e.error;
			void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__(msg, { lng }),
			});
		}
	};
}

slashCommands.add({
	command: 'invite-all-to',
	callback: inviteAll('to'),
	options: {
		description: 'Invite_user_to_join_channel_all_to',
		params: '#room',
		permission: ['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'],
	},
});
slashCommands.add({
	command: 'invite-all-from',
	callback: inviteAll('from'),
	options: {
		description: 'Invite_user_to_join_channel_all_from',
		params: '#room',
		permission: 'add-user-to-joined-room',
	},
});
module.exports = inviteAll;
