import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatTrigger } from '../../../../models/server/raw';

export async function findTriggers({ userId, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'view-livechat-manager'))) {
		throw new Error('error-not-authorized');
	}

	const cursor = await LivechatTrigger.find(
		{},
		{
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
		},
	);

	const total = await cursor.count();

	const triggers = await cursor.toArray();

	return {
		triggers,
		count: triggers.length,
		offset,
		total,
	};
}

export async function findTriggerById({ userId, triggerId }) {
	if (!(await hasPermissionAsync(userId, 'view-livechat-manager'))) {
		throw new Error('error-not-authorized');
	}

	return LivechatTrigger.findOneById(triggerId);
}
