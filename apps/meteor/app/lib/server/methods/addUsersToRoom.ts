import { api, FederationMatrix } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { isRoomNativeFederated } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { validateFederatedUsername } from '@rocket.chat/federation-matrix';
import { Subscriptions, Users, Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { beforeAddUsersToRoom } from '../../../../lib/callbacks/beforeAddUserToRoom';
import { i18n } from '../../../../server/lib/i18n';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { addUserToRoom } from '../functions/addUserToRoom';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addUsersToRoom(data: { rid: string; users: string[] }): boolean;
	}
}

export const sanitizeUsername = (username: string) => {
	const isFederatedUsername = username.includes('@') && username.includes(':');
	if (isFederatedUsername) {
		return username;
	}

	return username.replace(/(^@)|( @)/, '');
};

export const addUsersToRoomMethod = async (userId: string, data: { rid: string; users: string[] }, user?: IUser): Promise<boolean> => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'addUsersToRoom',
		});
	}

	if (!Match.test(data.rid, String)) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'addUsersToRoom',
		});
	}

	// Get user and room details
	const room = await Rooms.findOneById(data.rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'addUsersToRoom',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(data.rid, userId, {
		projection: { _id: 1 },
	});
	const userInRoom = subscription != null;

	// Can't add to direct room ever
	if (room.t === 'd') {
		throw new Meteor.Error('error-cant-invite-for-direct-room', "Can't invite user to direct rooms", {
			method: 'addUsersToRoom',
		});
	}

	// Can add to any room you're in, with permission, otherwise need specific room type permission
	let canAddUser = false;
	if (userInRoom && (await hasPermissionAsync(userId, 'add-user-to-joined-room', room._id))) {
		canAddUser = true;
	} else if (room.t === 'c' && (await hasPermissionAsync(userId, 'add-user-to-any-c-room'))) {
		canAddUser = true;
	} else if (room.t === 'p' && (await hasPermissionAsync(userId, 'add-user-to-any-p-room'))) {
		canAddUser = true;
	}

	// Adding wasn't allowed
	if (!canAddUser) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'addUsersToRoom',
		});
	}

	// Missing the users to be added
	if (!Array.isArray(data.users)) {
		throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
			method: 'addUsersToRoom',
		});
	}

	await beforeAddUsersToRoom.run({ usernames: data.users, inviter: user }, room);

	await Promise.all(
		data.users.map(async (username) => {
			const sanitizedUsername = sanitizeUsername(username);

			// If it's a federated username format and the room is not federated, throw error immediately
			if (validateFederatedUsername(sanitizedUsername) && !isRoomNativeFederated(room)) {
				throw new Meteor.Error('error-federated-users-in-non-federated-rooms', 'Cannot add federated users to non-federated rooms', {
					method: 'addUsersToRoom',
				});
			}

			const newUser = await Users.findOneByUsernameIgnoringCase(sanitizedUsername);
			if (!newUser) {
				throw new Meteor.Error('error-user-not-found', 'User not found', {
					method: 'addUsersToRoom',
				});
			}

			const subscription = await Subscriptions.findOneByRoomIdAndUserId(data.rid, newUser._id);
			if (!subscription) {
				let inviteOptions: { invited?: boolean; federation?: { inviteEventId?: string; inviterUsername?: string } } = {};

				if (isRoomNativeFederated(room) && user && newUser.username) {
					const inviteResult = await FederationMatrix.inviteUsersToRoom(room, [newUser.username], user);
					inviteOptions = {
						invited: true,
						federation: {
							inviteEventId: inviteResult.eventId,
							inviterUsername: user.username,
						},
					};
				}

				return addUserToRoom(data.rid, newUser, user, inviteOptions);
			}

			if (!newUser.username) {
				return;
			}

			void api.broadcast('notify.ephemeralMessage', userId, data.rid, {
				msg: i18n.t('Username_is_already_in_here', {
					postProcess: 'sprintf',
					sprintf: [newUser.username],
					lng: user?.language,
				}),
			});
		}),
	);

	return true;
};

Meteor.methods<ServerMethods>({
	async addUsersToRoom(data) {
		const uid = Meteor.userId();
		// Validate user and room
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addUsersToRoom',
			});
		}

		return addUsersToRoomMethod(uid, data, ((await Meteor.userAsync()) as IUser | null) ?? undefined);
	},
});
