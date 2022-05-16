import { ICustomUserStatus } from '@rocket.chat/core-typings';
import { SortOptionObject } from 'mongodb';

import { CustomUserStatus } from '../../../models/server/raw';

// TO-DO: use PaginatedRequest and PaginatedResult
export async function findCustomUserStatus({
	query = {},
	pagination: { offset, count, sort },
}: {
	query: {};
	pagination: { offset: number; count: number; sort: SortOptionObject<ICustomUserStatus> };
}): Promise<{
	statuses: ICustomUserStatus[];
	count: number;
	offset: number;
	total: number;
}> {
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
