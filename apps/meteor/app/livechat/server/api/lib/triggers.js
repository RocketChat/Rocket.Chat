import { LivechatTrigger } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

export async function findTriggers({ userId, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'view-livechat-manager'))) {
		throw new Error('error-not-authorized');
	}

	const { cursor, totalCount } = LivechatTrigger.findPaginated(
		{},
		{
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
		},
	);

	const [triggers, total] = await Promise.all([cursor.toArray(), totalCount]);

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
