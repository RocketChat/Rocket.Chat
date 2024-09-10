/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */

import { api } from '@rocket.chat/core-services';
import type { ISubscription, SlashCommand, SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { isTruthy } from '../../../lib/isTruthy';
import { i18n } from '../../../server/lib/i18n';
import { canAccessRoomAsync } from '../../authorization/server';
import { addUsersToRoomMethod } from '../../lib/server/methods/addUsersToRoom';
import { createChannelMethod } from '../../lib/server/methods/createChannel';
import { createPrivateGroupMethod } from '../../lib/server/methods/createPrivateGroup';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

function inviteAll<T extends string>(type: T): SlashCommand<T>['callback'] {
	return async function inviteAll({ command, params, message, userId }: SlashCommandCallbackParams<T>): Promise<void> {
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
		if (!userId) {
			return;
		}

		const user = await Users.findOneById(userId);
		if (!user) {
			return;
		}
		const lng = user?.language || settings.get('Language') || 'en';

		const baseChannel = type === 'to' ? await Rooms.findOneById(message.rid) : await Rooms.findOneByName(channel);
		const targetChannel = type === 'from' ? await Rooms.findOneById(message.rid) : await Rooms.findOneByName(channel);

		if (!baseChannel) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng,
				}),
			});
			return;
		}

		if (!(await canAccessRoomAsync(baseChannel, user))) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Room_not_exist_or_not_permission', { lng }),
			});
			return;
		}

		const cursor = Subscriptions.findByRoomIdWhenUsernameExists(baseChannel._id, {
			projection: { 'u.username': 1 },
		});

		try {
			const APIsettings = settings.get<number>('API_User_Limit');
			if (!APIsettings) {
				return;
			}
			if ((await cursor.count()) > APIsettings) {
				throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
					method: 'addAllToRoom',
				});
			}
			const users = (await cursor.toArray()).map((s: ISubscription) => s.u.username).filter(isTruthy);

			if (!targetChannel && ['c', 'p'].indexOf(baseChannel.t) > -1) {
				baseChannel.t === 'c' ? await createChannelMethod(userId, channel, users) : await createPrivateGroupMethod(user, channel, users);
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: i18n.t('Channel_created', {
						postProcess: 'sprintf',
						sprintf: [channel],
						lng,
					}),
				});
			} else {
				await addUsersToRoomMethod(userId, {
					rid: targetChannel?._id ?? '',
					users,
				});
			}
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Users_added', { lng }),
			});
		} catch (e: any) {
			const msg = e.error === 'cant-invite-for-direct-room' ? 'Cannot_invite_users_to_direct_rooms' : e.error;
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t(msg, { lng }),
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
