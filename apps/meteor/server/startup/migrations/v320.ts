import type { IRole, IUser } from '@rocket.chat/core-typings';
import { ROOM_ROLE_PRIORITY_MAP } from '@rocket.chat/core-typings';
import { Users, Subscriptions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

export const getRoomRolePriorityForRole = (role: IRole['_id']) =>
	(ROOM_ROLE_PRIORITY_MAP as { [key: IRole['_id']]: number })[role] ?? ROOM_ROLE_PRIORITY_MAP.default;

export const calculateRoomRolePriorityFromRoles = (roles: IRole['_id'][]) => {
	return roles.reduce((acc, roleId) => Math.min(acc, getRoomRolePriorityForRole(roleId)), ROOM_ROLE_PRIORITY_MAP.default);
};

const READ_BATCH_SIZE = 1000;
const WRITE_BATCH_SIZE = 1000;

async function assignRoomRolePrioritiesFromMap(userIdAndroomRolePrioritiesMap: Map<IUser['_id'], IUser['roomRolePriorities']>) {
	const bulkOperations: any[] = [];
	let counter = 0;

	const mapValues = userIdAndroomRolePrioritiesMap.entries();
	for (const [userId, roomRolePriorities] of mapValues) {
		userIdAndroomRolePrioritiesMap.delete(userId);
		if (roomRolePriorities) {
			bulkOperations.push({
				updateOne: {
					filter: { _id: userId },
					update: {
						$set: {
							...Object.entries(roomRolePriorities).reduce(
								(operations, roomPriority) => {
									const [rid, priority] = roomPriority;
									operations[`roomRolePriorities.${rid}`] = priority;
									return operations;
								},
								{} as Record<string, number>,
							),
						},
					},
				},
			});

			counter++;

			if (counter >= WRITE_BATCH_SIZE) {
				// eslint-disable-next-line no-await-in-loop
				await Users.col.bulkWrite(bulkOperations, { ordered: false });
				bulkOperations.length = 0;
				counter = 0;
			}
		}
	}

	if (bulkOperations.length > 0) {
		await Users.col.bulkWrite(bulkOperations, { ordered: false });
	}

	return userIdAndroomRolePrioritiesMap;
}

addMigration({
	version: 320,
	name: 'Add "roomRolePriorities" field to users',
	async up() {
		let userIdAndroomRolePrioritiesMap = new Map<IUser['_id'], IUser['roomRolePriorities']>();

		let skip = 0;

		let hasMoreSubscriptions = true;
		do {
			const subscriptionsCursor = Subscriptions.find(
				{ roles: { $exists: true } },
				{
					projection: { 'rid': 1, 'roles': 1, 'u._id': 1 },
					sort: { _id: 1 },
					skip,
					limit: READ_BATCH_SIZE,
				},
			);

			// eslint-disable-next-line no-await-in-loop
			const subscriptions = await subscriptionsCursor.toArray();

			if (subscriptions.length === 0) {
				hasMoreSubscriptions = false;
				break;
			}

			for (const sub of subscriptions) {
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

			skip += READ_BATCH_SIZE;
		} while (hasMoreSubscriptions);

		userIdAndroomRolePrioritiesMap = await assignRoomRolePrioritiesFromMap(userIdAndroomRolePrioritiesMap);
	},
});
