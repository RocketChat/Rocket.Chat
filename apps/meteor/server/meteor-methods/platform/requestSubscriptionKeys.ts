import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms, Users } from '@rocket.chat/models';

import { notifyOnRoomChangedById } from '../../lib/notifyListener';
import { settings } from '../../settings';

// Adds the caller to the key queue (usersWaitingForE2EKeys) of every encrypted room
// where the caller is a member without a room key. Members that hold the key react
// to the room change and encrypt the key for the caller.
export const requestSubscriptionKeysMethod = async (userId: string): Promise<void> => {
	if (!settings.get<boolean>('E2E_Enable')) {
		return;
	}

	// A member without a public key cannot receive a room key
	const user = await Users.findOneById<Pick<IUser, '_id' | 'e2e'>>(userId, { projection: { 'e2e.public_key': 1 } });
	if (!user?.e2e?.public_key) {
		return;
	}

	const subscriptions = await Subscriptions.findByUserIdWithoutE2E(userId, { projection: { rid: 1 } }).toArray();
	if (!subscriptions.length) {
		return;
	}

	const rooms = await Rooms.findEncryptedByIdsWithE2eKeyIdAndUserNotQueued<Pick<IRoom, '_id'>>(
		subscriptions.map(({ rid }) => rid),
		userId,
		{ projection: { _id: 1 } },
	).toArray();

	const roomIds = rooms.map(({ _id }) => _id);
	if (!roomIds.length) {
		return;
	}

	const { modifiedCount } = await Rooms.addUserIdToE2EEQueueByRoomIds(roomIds, userId);
	if (modifiedCount) {
		void notifyOnRoomChangedById(roomIds);
	}
};
