import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { isTruthy } from '../../../../lib/isTruthy';

export async function fetchUsersWaitingForGroupKey(): Promise<{
	usersWaitingForE2EKeys: Record<IRoom['_id'], { _id: IUser['_id']; public_key: string }[]>;
	hasMore: boolean;
}> {
	const userId = Meteor.userId();

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const roomIds = (await Subscriptions.findByUserId(userId, { projection: { rid: 1 } }).toArray()).map((sub) => sub.rid);

	const cursor = Rooms.findRoomsByRoomIdsWithE2EEQueue(roomIds, { projection: { usersWaitingForE2EKeys: 1 } });

	const count = await cursor.count();

	const hasMore = count > 10;
	const rooms = await cursor.limit(10).toArray();

	const usersWaitingForE2EKeys = Object.fromEntries(
		(
			await Promise.all(
				rooms.map(async (room) => {
					const userIds = room?.usersWaitingForE2EKeys?.map((item) => item.userId)?.filter((uid) => uid !== userId);

					if (!userIds || userIds.length === 0) {
						return;
					}

					const users = (await Users.findByIdsWithPublicE2EKey(userIds, { projection: { e2e: 1 } }).toArray()).map((user) => ({
						_id: user._id,
						public_key: user.e2e?.public_key as string,
					}));

					return [room._id, users];
				}),
			)
		).filter(isTruthy),
	);

	return { usersWaitingForE2EKeys, hasMore };
}
