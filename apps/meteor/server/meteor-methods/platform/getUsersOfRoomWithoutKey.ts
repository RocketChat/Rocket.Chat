import { ClientSafeError } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';

import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';

export const getUsersOfRoomWithoutKeyMethod = async (
	userId: string,
	rid: IRoom['_id'],
): Promise<{ users: Pick<IUser, '_id' | 'e2e'>[] }> => {
	if (!(await canAccessRoomIdAsync(rid, userId))) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'e2e.getUsersOfRoomWithoutKey' });
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
