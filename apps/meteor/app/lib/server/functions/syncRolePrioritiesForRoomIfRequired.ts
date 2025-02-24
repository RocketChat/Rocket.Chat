import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Users, Rooms } from '@rocket.chat/models';

import { calculateRoomRolePriorityFromRoles } from '../../../../lib/roles/calculateRoomRolePriorityFromRoles';

const READ_BATCH_SIZE = 1000;

const SYNC_VERSION = 2;

async function assignRoomRolePrioritiesFromMap(userIdAndRoomRolePrioritiesMap: Map<IUser['_id'], IUser['roomRolePriorities']>) {
	const bulk = Users.col.initializeUnorderedBulkOp();

	userIdAndRoomRolePrioritiesMap.forEach((roomRolePriorities, userId) => {
		userIdAndRoomRolePrioritiesMap.delete(userId);

		if (roomRolePriorities) {
			const updateFields = Object.entries(roomRolePriorities).reduce(
				(operations, rolePriorityData) => {
					const [rid, rolePriority] = rolePriorityData;
					operations[`roomRolePriorities.${rid}`] = rolePriority;
					return operations;
				},
				{} as Record<string, number>,
			);

			bulk.find({ _id: userId }).updateOne({
				$set: updateFields,
			});
		}
	});

	if (bulk.length > 0) {
		await bulk.execute();
	}
}

export const syncRolePrioritiesForRoomIfRequired = async (rid: IRoom['_id']) => {
	const userIdAndRoomRolePrioritiesMap = new Map<IUser['_id'], IUser['roomRolePriorities']>();

	if (await Rooms.hasCreatedRolePrioritiesForRoom(rid, SYNC_VERSION)) {
		return;
	}

	const cursor = Subscriptions.find(
		{ rid, roles: { $exists: true } },
		{
			projection: { 'rid': 1, 'roles': 1, 'u._id': 1 },
			sort: { _id: 1 },
		},
	).batchSize(READ_BATCH_SIZE);

	for await (const sub of cursor) {
		if (!sub.roles?.length) {
			continue;
		}

		const userId = sub.u._id;
		const roomId = sub.rid;
		const priority = calculateRoomRolePriorityFromRoles(sub.roles);

		const existingPriorities = userIdAndRoomRolePrioritiesMap.get(userId) || {};
		existingPriorities[roomId] = priority;
		userIdAndRoomRolePrioritiesMap.set(userId, existingPriorities);
	}

	// Flush any remaining priorities in the map
	await assignRoomRolePrioritiesFromMap(userIdAndRoomRolePrioritiesMap);

	await Rooms.markRolePrioritesCreatedForRoom(rid, SYNC_VERSION);
};
