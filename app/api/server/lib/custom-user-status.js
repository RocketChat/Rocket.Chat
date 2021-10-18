import { CustomUserStatus } from '../../../models/server/raw';

export async function findCustomUserStatus({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await CustomUserStatus.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const statuses = await cursor.toArray();

	return {
		statuses,
		count: statuses.length,
		offset,
		total,
	};
}
