import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatFilter } from '../../../../models/server/raw';

export async function findFilters({ userId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-livechat-manager')) {
		throw new Error('error-not-authorized');
	}

	const cursor = await LivechatFilter.find({}, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const filters = await cursor.toArray();

	return {
		filters,
		count: filters.length,
		offset,
		total,
	};
}

export async function findFilterById({ userId, filterId }) {
	if (!await hasPermissionAsync(userId, 'view-livechat-manager')) {
		throw new Error('error-not-authorized');
	}

	return LivechatFilter.findOneById(filterId);
}
