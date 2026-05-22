import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.getUsersOfRoomWithoutKey'(rid: IRoom['_id']): { users: Pick<IUser, '_id' | 'e2e'>[] };
	}
}

export const getUsersOfRoomWithoutKeyMethod = async (
	userId: string,
	rid: IRoom['_id'],
): Promise<{ users: Pick<IUser, '_id' | 'e2e'>[] }> => {
	if (!(await canAccessRoomIdAsync(rid, userId))) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.getUsersOfRoomWithoutKey' });
	}

	const subscriptions = await Subscriptions.findByRidWithoutE2EKey(rid, {
		projection: { 'u._id': 1 },
	}).toArray();
	const userIds = subscriptions.map((s) => s.u._id);
	const options = { projection: { 'e2e.public_key': 1 } };

	const users = await Users.findByIdsWithPublicE2EKey(userIds, options).toArray();

	return {
		users,
	};
};

Meteor.methods<ServerMethods>({
	async 'e2e.getUsersOfRoomWithoutKey'(rid) {
		check(rid, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'e2e.getUsersOfRoomWithoutKey',
			});
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'e2e.getUsersOfRoomWithoutKey',
			});
		}

		return getUsersOfRoomWithoutKeyMethod(userId, rid);
	},
});
