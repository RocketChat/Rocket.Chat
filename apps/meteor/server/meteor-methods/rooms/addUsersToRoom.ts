import { api, ClientSafeError } from '@rocket.chat/core-services';
import { isBannedSubscription, isRoomNativeFederated, type IRoom, type IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Users, Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { beforeAddUsersToRoom } from '../../lib/callbacks/beforeAddUserToRoom';
import { i18n } from '../../lib/i18n';
import { addUserToRoom } from '../../lib/rooms/addUserToRoom';

export const sanitizeUsername = (username: string) => {
	const isFederatedUsername = username.includes('@') && username.includes(':');
	if (isFederatedUsername) {
		return username;
	}

	return username.replace(/(^@)|( @)/, '');
};

export const assertCanAddUsersToRoom = async (userId: string, room: IRoom): Promise<void> => {
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, userId, {
		projection: { _id: 1 },
	});
	const userInRoom = subscription != null;

	if (room.t === 'd' && !isRoomNativeFederated(room)) {
		throw new ClientSafeError('error-cant-invite-for-direct-room', "Can't invite user to direct rooms", {
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
		throw new ClientSafeError('error-not-allowed', 'Not allowed', {
			method: 'addUsersToRoom',
		});
	}
};

export const addUsersToRoomMethod = async (userId: string, data: { rid: string; users: string[] }, user?: IUser): Promise<boolean> => {
	if (!userId) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', {
			method: 'addUsersToRoom',
		});
	}

	if (!Match.test(data.rid, String)) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', {
			method: 'addUsersToRoom',
		});
	}

	// Get user and room details
	const room = await Rooms.findOneById(data.rid);
	if (!room) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', {
			method: 'addUsersToRoom',
		});
	}

	await assertCanAddUsersToRoom(userId, room);

	// Missing the users to be added
	if (!Array.isArray(data.users)) {
		throw new ClientSafeError('error-invalid-arguments', 'Invalid arguments', {
			method: 'addUsersToRoom',
		});
	}

	await beforeAddUsersToRoom.run({ usernames: data.users, inviter: user }, room);

	await Promise.all(
		data.users.map(async (username) => {
			const sanitizedUsername = sanitizeUsername(username);

			const newUser = await Users.findOneByUsernameIgnoringCase(sanitizedUsername);
			if (!newUser) {
				throw new ClientSafeError('error-user-not-found', 'User not found', {
					method: 'addUsersToRoom',
				});
			}

			const subscription = await Subscriptions.findOneByRoomIdAndUserId(data.rid, newUser._id);
			if (subscription && isBannedSubscription(subscription)) {
				throw new ClientSafeError('error-user-is-banned', 'User is banned from this room', {
					method: 'addUsersToRoom',
				});
			}
			if (!subscription) {
				return addUserToRoom(data.rid, newUser, user);
			}
			if (!newUser.username) {
				return;
			}
			void api.broadcast('notify.ephemeralMessage', userId, data.rid, {
				msg: i18n.t('Username_is_already_in_here', {
					interpolation: { escapeValue: false },
					username: newUser.username,
					lng: user?.language,
				}),
			});
		}),
	);

	return true;
};
