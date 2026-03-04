import { api, FederationMatrix, isMeteorError } from '@rocket.chat/core-services';
import type { IUser, SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { validateFederatedUsername } from '@rocket.chat/federation-matrix';
import { Subscriptions, Users, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../server/lib/i18n';
import { FederationActions } from '../../../server/services/room/hooks/BeforeFederationActions';
import { addUsersToRoomMethod, sanitizeUsername } from '../../lib/server/methods/addUsersToRoom';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

// Type guards for the error
function isStringError(error: unknown): error is { error: string } {
	return typeof (error as any)?.error === 'string';
}

/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */
slashCommands.add({
	command: 'invite',
	callback: async ({ params, message, userId }: SlashCommandCallbackParams<'invite'>): Promise<void> => {
		let usernames = params
			.split(/[\s,]/)
			.map((username) => sanitizeUsername(username))
			.filter((a) => a !== '');
		if (usernames.length === 0) {
			return;
		}

		// Get room information for federation check
		const room = await Rooms.findOneById(message.rid);
		if (!room) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('error-invalid-room', { lng: settings.get('Language') || 'en' }),
			});
			return;
		}

		// Ensure federated users exist locally before looking them up
		const federatedUsernames = usernames.filter((u) => validateFederatedUsername(u)) as string[];
		if (federatedUsernames.length > 0) {
			if (FederationActions.shouldPerformFederationAction(room)) {
				await FederationMatrix.ensureFederatedUsersExistLocally(federatedUsernames);
			} else {
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: i18n.t('You_cannot_add_external_users_to_non_federated_room', { lng: settings.get('Language') || 'en' }),
				});
				// These federated users shouldn't be invited and we already broadcasted the error message
				usernames = usernames.filter((username) => {
					return !federatedUsernames.includes(username);
				});
				if (usernames.length === 0) {
					return;
				}
			}
		}

		const users = await Users.findByUsernames(usernames).toArray();
		if (users.length === 0) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('User_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [usernames.join(' @')],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		const usersFiltered: IUser[] = [];

		for await (const user of users) {
			const subscription = await Subscriptions.findOneByRoomIdAndUserId(message.rid, user._id, {
				projection: { _id: 1 },
			});
			if (subscription == null) {
				usersFiltered.push(user as IUser);
				continue;
			}
			const usernameStr = user.username as string;
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Username_is_already_in_here', {
					postProcess: 'sprintf',
					sprintf: [usernameStr],
					lng: settings.get('Language') || 'en',
				}),
			});
		}

		const inviter = await Users.findOneById(userId);

		if (!inviter) {
			throw new Meteor.Error('error-user-not-found', 'Inviter not found', {
				method: 'slashcommand-invite',
			});
		}

		await Promise.all(
			usersFiltered.map(async (user) => {
				try {
					// TODO: Refactor this to return an error if some user fails to be added
					return await addUsersToRoomMethod(
						userId,
						{
							rid: message.rid,
							users: [user.username || ''],
						},
						inviter,
					);
				} catch (e: unknown) {
					if (isMeteorError(e)) {
						if (e.error === 'error-only-compliant-users-can-be-added-to-abac-rooms') {
							void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
								msg: i18n.t(e.error, { lng: settings.get('Language') || 'en' }),
							});
						} else {
							void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
								msg: i18n.t(e.message, { lng: settings.get('Language') || 'en' }),
							});
						}
						return;
					}

					if (isStringError(e)) {
						const { error } = e;
						if (error === 'error-federated-users-in-non-federated-rooms') {
							void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
								msg: i18n.t('You_cannot_add_external_users_to_non_federated_room', { lng: settings.get('Language') || 'en' }),
							});
						} else if (error === 'cant-invite-for-direct-room') {
							void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
								msg: i18n.t('Cannot_invite_users_to_direct_rooms', { lng: settings.get('Language') || 'en' }),
							});
						} else {
							void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
								msg: i18n.t(error, { lng: settings.get('Language') || 'en' }),
							});
						}
					}
				}
			}),
		);
	},
	options: {
		description: 'Invite_user_to_join_channel',
		params: '@username',
		permission: 'add-user-to-joined-room',
	},
});
