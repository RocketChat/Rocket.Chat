import { CustomSounds } from '../../../models/server/raw';

export async function findCustomSounds({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await CustomSounds.find(query, {
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
