import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import LivechatPriority from '../../../../models/server/raw/LivechatPriority';
import { LivechatRooms, Users } from '../../../../../../app/models/server/raw';
import { LivechatEnterprise } from '../../lib/LivechatEnterprise';

export async function findPriorities({ userId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-priorities')) {
		throw new Error('error-not-authorized');
	}
	const cursor = LivechatPriority.find({}, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const priorities = await cursor.toArray();

	return {
		priorities,
		count: priorities.length,
		offset,
		total,
	};
}

export async function findPriorityById({ userId, priorityId }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-priorities')) {
		throw new Error('error-not-authorized');
	}
	return LivechatPriority.findOneById(priorityId);
}

export async function setPriorityToRoom({ userId, roomId, priorityId }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-priorities')) {
		throw new Error('error-not-authorized');
	}
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('Invalid Room');
	}
	const priority = await LivechatPriority.findOneById(priorityId);
	if (!priority && priorityId !== '') {
		throw new Error('Invalid priority');
	}
	if (priority) {
		await LivechatRooms.setPriorityById(roomId, priority);
	} else {
		await LivechatRooms.unsetPriorityById(roomId);
	}
	LivechatEnterprise.savePriorityDataOnRooms(await LivechatRooms.findOneById(roomId), await Users.findOneById(userId, { fields: { username: 1 } }));
}
