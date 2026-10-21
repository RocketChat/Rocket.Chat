import { ClientSafeError } from '@rocket.chat/core-services';
import type { ICreateRoomParams } from '@rocket.chat/core-services';
import type { ICreatedRoom, IUser } from '@rocket.chat/core-typings';
import { validateFederatedUsername } from '@rocket.chat/federation-matrix';
import { Rooms, Users } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { callbacks } from '../../lib/callbacks';
import { createRoom } from '../../lib/rooms/createRoom';
import { isFederationEnabled } from '../../services/federation/utils';
import { settings } from '../../settings';

export async function createDirectMessage(
	usernames: IUser['username'][],
	userId: IUser['_id'] | null,
	excludeSelf = false,
): Promise<Omit<ICreatedRoom, '_id' | 'inserted'>> {
	check(usernames, [String]);
	check(userId, String);
	check(excludeSelf, Match.Optional(Boolean));

	if (!userId) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	const me = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
	if (!me?.username) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	const myUsername = me.username.toLowerCase();

	const targets = usernames.filter((username) => username.toLowerCase() !== myUsername);

	if (!targets.length && (excludeSelf || settings.get('Message_AllowDirectMessagesToYourself') === false)) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	const maxUsers = settings.get<number>('DirectMesssage_maxUsers') || 1;
	if ((excludeSelf ? targets.length : targets.length + 1) > maxUsers) {
		throw new ClientSafeError(
			'error-direct-message-max-user-exceeded',
			`You cannot add more than ${maxUsers} users, including yourself to a direct message`,
			{ method: 'createDirectMessage' },
		);
	}

	const users = await Promise.all(
		targets.map(async (username) => {
			if (isFederationEnabled() && validateFederatedUsername(username)) {
				return username;
			}

			const to: IUser | null = await Users.findOneByUsernameIgnoringCase(username);
			if (to) {
				return to;
			}

			throw new ClientSafeError('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}),
	);

	const options: Exclude<ICreateRoomParams['options'], undefined> = { creator: me._id };
	const roomUsers = excludeSelf ? users : [me, ...users];

	// allow self-DMs
	if (roomUsers.length === 1 && roomUsers[0] !== undefined && typeof roomUsers[0] !== 'string' && roomUsers[0]._id !== me._id) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	if (!(await hasPermissionAsync(userId, 'create-d'))) {
		// If the user can't create DMs but can access already existing ones
		if ((await hasPermissionAsync(userId, 'view-d-room')) && !roomUsers.some((user) => typeof user === 'string')) {
			// Check if the direct room already exists, then return it
			const uids = (roomUsers as IUser[]).map(({ _id }) => _id).sort();
			// No projection: the full room is spread into the ICreatedRoom-shaped return below.
			const room = await Rooms.findOneDirectRoomContainingAllUserIDs(uids);
			if (room) {
				return {
					...room,
					t: 'd',
					rid: room._id,
				};
			}
		}

		throw new ClientSafeError('error-not-allowed', 'Not allowed', {
			method: 'createDirectMessage',
		});
	}

	if (excludeSelf && (await hasPermissionAsync(userId, 'create-d-other-users'))) {
		options.subscriptionExtra = { open: true };
	}

	const extraData = {};

	try {
		await callbacks.run('federation.beforeCreateDirectMessage', roomUsers, extraData);
	} catch (error) {
		throw new ClientSafeError((error as any)?.message);
	}
	const {
		_id: rid,
		inserted,
		...room
	} = await createRoom<'d'>('d', undefined, undefined, roomUsers as IUser[], false, undefined, extraData, options);

	return {
		// @ts-expect-error - room type is already defined in the `createRoom` return type
		t: 'd',
		// @ts-expect-error - room id is not defined in the `createRoom` return type
		rid,
		...room,
	};
}
