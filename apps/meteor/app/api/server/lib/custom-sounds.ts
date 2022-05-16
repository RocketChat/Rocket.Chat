import { ICustomSound } from '@rocket.chat/core-typings';
import { SortOptionObject } from 'mongodb';

import { CustomSounds } from '../../../models/server/raw';

// TO-DO: use PaginatedRequest and PaginatedResult
export async function findCustomSounds({
	query = {},
	pagination: { offset, count, sort },
}: {
	query: {};
	pagination: { offset: number; count: number; sort: SortOptionObject<ICustomSound> };
}): Promise<unknown> {
	const cursor = CustomSounds.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const sounds = await cursor.toArray();

	return {
		sounds,
		count: sounds.length,
		offset,
		total,
	};
}
