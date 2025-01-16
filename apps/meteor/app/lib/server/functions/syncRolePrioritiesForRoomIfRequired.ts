import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import { ROOM_ROLE_PRIORITY_MAP } from '@rocket.chat/core-typings';
import { Subscriptions, Users, Rooms } from '@rocket.chat/models';

export const getRoomRolePriorityForRole = (role: IRole['_id']) =>
	(ROOM_ROLE_PRIORITY_MAP as { [key: IRole['_id']]: number })[role] ?? ROOM_ROLE_PRIORITY_MAP.default;

export const calculateRoomRolePriorityFromRoles = (roles: IRole['_id'][]) => {
	return roles.reduce((acc, roleId) => Math.min(acc, getRoomRolePriorityForRole(roleId)), ROOM_ROLE_PRIORITY_MAP.default);
};

const READ_BATCH_SIZE = 1000;

async function assignRoomRolePrioritiesFromMap(userIdAndroomRolePrioritiesMap: Map<IUser['_id'], IUser['roomRolePriorities']>) {
	const bulk = Users.col.initializeUnorderedBulkOp();

	for await (const [userId, roomRolePriorities] of userIdAndroomRolePrioritiesMap.entries()) {
		userIdAndroomRolePrioritiesMap.delete(userId);

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
	}

	if (bulk.length > 0) {
		await bulk.execute();
	}
}

export const syncRolePrioritiesForRoomIfRequired = async (rid: IRoom['_id']) => {
	const userIdAndroomRolePrioritiesMap = new Map<IUser['_id'], IUser['roomRolePriorities']>();

	if (await Rooms.hasCreatedRolePrioritiesForRoom(rid)) {
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

		const existingPriorities = userIdAndroomRolePrioritiesMap.get(userId) || {};
		existingPriorities[roomId] = priority;
		userIdAndroomRolePrioritiesMap.set(userId, existingPriorities);
	}

	// Flush any remaining priorities in the map
	await assignRoomRolePrioritiesFromMap(userIdAndroomRolePrioritiesMap);

	await Rooms.markRolePrioritesCreatedForRoom(rid);
};
