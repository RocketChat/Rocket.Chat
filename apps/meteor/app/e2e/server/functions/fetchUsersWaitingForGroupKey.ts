import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { isTruthy } from '../../../../lib/isTruthy';

const NUMBER_OF_ROOMS = 10;
const QUEUE_SIZE = 50;

export async function fetchUsersWaitingForGroupKey(userId: IUser['_id']): Promise<{
	usersWaitingForE2EKeys: Record<IRoom['_id'], { _id: IUser['_id']; public_key: string }[]>;
	hasMore: boolean;
}> {
	const roomIds = (await Subscriptions.findByUserId(userId, { projection: { rid: 1 } }).toArray()).map((sub) => sub.rid);

	const cursor = Rooms.findRoomsByRoomIdsWithE2EEQueue(roomIds, { projection: { usersWaitingForE2EKeys: 1 } });

	const count = await cursor.count();

	const hasMore = count > NUMBER_OF_ROOMS;
	const encryptedRoomIds = (await cursor.toArray()).map((room) => room._id);

	const rooms = await Rooms.fetchRandomUsersFromE2EEQueue(encryptedRoomIds, NUMBER_OF_ROOMS, QUEUE_SIZE);

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
