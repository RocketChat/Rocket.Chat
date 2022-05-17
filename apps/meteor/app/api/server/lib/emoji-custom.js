import { EmojiCustom } from '../../../models/server/raw';

export async function findEmojisCustom({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = EmojiCustom.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const emojis = await cursor.toArray();

	return {
		emojis,
		count: emojis.length,
		offset,
		total,
	};
}
