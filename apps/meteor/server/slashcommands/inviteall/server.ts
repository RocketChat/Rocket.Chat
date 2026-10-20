/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */

import { api, isMeteorError } from '@rocket.chat/core-services';
import type { IRoom, SlashCommand, SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../lib/authorization';
import { i18n } from '../../lib/i18n';
import type { AbacEvaluableUser } from '../../lib/rooms/filterUsersAllowedInRoom';
import { filterUsersAllowedInRoomOrThrow } from '../../lib/rooms/filterUsersAllowedInRoom';
import { slashCommands } from '../../lib/utils/slashCommand';
import { addUsersToRoomMethod, assertCanAddUsersToRoom } from '../../meteor-methods/rooms/addUsersToRoom';
import { createChannelMethod } from '../../meteor-methods/rooms/createChannel';
import { createPrivateGroupMethod } from '../../meteor-methods/rooms/createPrivateGroup';
import { settings } from '../../settings';

type InvitedMember = Required<AbacEvaluableUser>;

async function partitionMembersAllowedInRoom(
	userId: string,
	members: InvitedMember[],
	room: IRoom | null,
): Promise<{ allowed: string[]; skipped: InvitedMember[] }> {
	if (!room) {
		return { allowed: members.map(({ username }) => username), skipped: [] };
	}

	await assertCanAddUsersToRoom(userId, room);

	const allowedIds = new Set((await filterUsersAllowedInRoomOrThrow(members, room)).map(({ _id }) => _id));

	return {
		allowed: members.filter(({ _id }) => allowedIds.has(_id)).map(({ username }) => username),
		skipped: members.filter(({ _id }) => !allowedIds.has(_id)),
	};
}

function reportAddedAndSkipped(
	userId: string,
	rid: string,
	lng: string,
	{ added, skipped }: { added: number; skipped: InvitedMember[] },
): void {
	if (added || !skipped.length) {
		void api.broadcast('notify.ephemeralMessage', userId, rid, {
			msg: i18n.t('Users_added', { lng }),
		});
	}

	if (skipped.length) {
		void api.broadcast('notify.ephemeralMessage', userId, rid, {
			msg: i18n.t('ABAC_Members_Not_Added_Usernames', {
				interpolation: { escapeValue: false },
				usernames: skipped.map(({ username }) => `@${username}`).join(', '),
				lng,
			}),
			mentions: skipped.map(({ _id, username }) => ({ _id, username, type: 'user' as const })),
		});
	}
}

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
					interpolation: { escapeValue: false },
					channelName: channel,
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

		try {
			const APIsettings = settings.get<number>('API_User_Limit');
			if (!APIsettings) {
				return;
			}
			if ((await Subscriptions.countByRoomIdWhenUsernameExists(baseChannel._id)) > APIsettings) {
				throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
					method: 'addAllToRoom',
				});
			}

			const cursor = Subscriptions.findByRoomIdWhenUsernameExists(baseChannel._id, {
				projection: { 'u._id': 1, 'u.username': 1 },
			});
			const members = (await cursor.toArray()).flatMap(({ u: { _id, username } }) => (username ? [{ _id, username }] : []));
			const users = members.map(({ username }) => username);

			if (!targetChannel && ['c', 'p'].indexOf(baseChannel.t) > -1) {
				const { skippedMembers = [] } =
					baseChannel.t === 'c' ? await createChannelMethod(userId, channel, users) : await createPrivateGroupMethod(user, channel, users);
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: i18n.t('Channel_created', {
						interpolation: { escapeValue: false },
						channelName: channel,
						lng,
					}),
				});
				reportAddedAndSkipped(userId, message.rid, lng, {
					added: users.length - skippedMembers.length,
					skipped: members.filter(({ username }) => skippedMembers.includes(username)),
				});
			} else {
				const { allowed, skipped } = await partitionMembersAllowedInRoom(userId, members, targetChannel);
				await addUsersToRoomMethod(userId, {
					rid: targetChannel?._id ?? '',
					users: allowed,
				});
				reportAddedAndSkipped(userId, message.rid, lng, { added: allowed.length, skipped });
			}
		} catch (e: unknown) {
			const error = isMeteorError(e) && typeof e.error === 'string' ? e.error : undefined;
			const key = error === 'cant-invite-for-direct-room' ? 'Cannot_invite_users_to_direct_rooms' : error;
			const translationKey = key && i18n.exists(key) ? key : undefined;

			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t(translationKey ?? 'Error_something_went_wrong', { lng }),
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
