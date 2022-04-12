import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Statistics } from '../../../models/server/raw';

export async function getStatistics({ userId, query = {}, pagination: { offset, count, sort, fields } }) {
	if (!(await hasPermissionAsync(userId, 'view-statistics'))) {
		throw new Error('error-not-allowed');
	}

	const cursor = Statistics.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
		fields,
	});

	const total = await cursor.count();

	const statistics = await cursor.toArray();

	return {
		statistics,
		count: statistics.length,
		offset,
		total,
	};
}
