import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import LivechatPriority from '../../../../models/server/raw/LivechatPriority';

export async function findPriorities({ userId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-priorities') && !await hasPermissionAsync(userId, 'view-l-room')) {
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
	if (!await hasPermissionAsync(userId, 'manage-livechat-priorities') && !await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}
	return LivechatPriority.findOneById(priorityId);
}
