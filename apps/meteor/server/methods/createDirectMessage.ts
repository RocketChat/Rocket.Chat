import type { ICreateRoomParams } from '@rocket.chat/core-services';
import type { ICreatedRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { addUser } from '../../app/federation/server/functions/addUser';
import { createRoom } from '../../app/lib/server/functions/createRoom';
import { RateLimiterClass as RateLimiter } from '../../app/lib/server/lib/RateLimiter';
import { settings } from '../../app/settings/server';
import { callbacks } from '../../lib/callbacks';

export async function createDirectMessage(
	usernames: IUser['username'][],
	userId: IUser['_id'] | null,
	excludeSelf = false,
): Promise<Omit<ICreatedRoom, '_id' | 'inserted'>> {
	check(usernames, [String]);
	check(userId, String);
	check(excludeSelf, Match.Optional(Boolean));

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	const me = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
	if (!me?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	if (settings.get('Message_AllowDirectMessagesToYourself') === false && usernames.length === 1 && me.username === usernames[0]) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	const users = await Promise.all(
		usernames
			.filter((username) => username !== me.username)
			.map(async (username) => {
				let to: IUser | null = await Users.findOneByUsernameIgnoringCase(username);

				// If the username does have an `@`, but does not exist locally, we create it first
				if (!to && username.includes('@')) {
					try {
						to = await addUser(username);
					} catch {
						// no-op
					}
					if (!to) {
						return username;
					}
				}

				if (!to) {
					throw new Meteor.Error('error-invalid-user', 'Invalid user', {
						method: 'createDirectMessage',
					});
				}
				return to;
			}),
	);
	const roomUsers = excludeSelf ? users : [me, ...users];

	// allow self-DMs
	if (roomUsers.length === 1 && roomUsers[0] !== undefined && typeof roomUsers[0] !== 'string' && roomUsers[0]._id !== me._id) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	if (!(await hasPermissionAsync(userId, 'create-d'))) {
		// If the user can't create DMs but can access already existing ones
		if ((await hasPermissionAsync(userId, 'view-d-room')) && !Object.keys(roomUsers).some((user) => typeof user === 'string')) {
			// Check if the direct room already exists, then return it
			const uids = (roomUsers as IUser[]).map(({ _id }) => _id).sort();
			const room = await Rooms.findOneDirectRoomContainingAllUserIDs(uids, { projection: { _id: 1 } });
			if (room) {
				return {
					...room,
					t: 'd',
					rid: room._id,
				};
			}
		}

		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'createDirectMessage',
		});
	}

	const options: Exclude<ICreateRoomParams['options'], undefined> = { creator: me._id };
	if (excludeSelf && (await hasPermissionAsync(userId, 'view-room-administration'))) {
		options.subscriptionExtra = { open: true };
	}
	try {
		await callbacks.run('federation.beforeCreateDirectMessage', roomUsers);
	} catch (error) {
		throw new Meteor.Error((error as any)?.message);
	}
	const {
		_id: rid,
		inserted,
		...room
	} = await createRoom<'d'>('d', undefined, undefined, roomUsers as IUser[], false, undefined, {}, options);

	return {
		// @ts-expect-error - room type is already defined in the `createRoom` return type
		t: 'd',
		// @ts-expect-error - room id is not defined in the `createRoom` return type
		rid,
		...room,
	};
}

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createDirectMessage(...usernames: Exclude<IUser['username'], undefined>[]): Omit<ICreatedRoom, '_id' | 'inserted'>;
	}
}

Meteor.methods<ServerMethods>({
	async createDirectMessage(...usernames) {
		return createDirectMessage(usernames, Meteor.userId());
	},
});

RateLimiter.limitMethod('createDirectMessage', 10, 60000, {
	async userId(userId: IUser['_id']) {
		return !(await hasPermissionAsync(userId, 'send-many-messages'));
	},
});
