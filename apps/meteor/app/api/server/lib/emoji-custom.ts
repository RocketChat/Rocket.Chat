import { IEmojiCustom, ILivechatDepartmentRecord } from '@rocket.chat/core-typings';
import { FilterQuery, SortOptionObject } from 'mongodb';
import { EmojiCustom } from '@rocket.chat/models';

export async function findEmojisCustom({
	query = {},
	pagination: { offset, count, sort },
}: {
	query: FilterQuery<ILivechatDepartmentRecord>;
	pagination: { offset: number; count: number; sort: SortOptionObject<IEmojiCustom> };
}): Promise<{
	emojis: IEmojiCustom[];
	count: number;
	offset: any;
	total: number;
}> {
	const { cursor, totalCount: total } = await EmojiCustom.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const emojis = await cursor.toArray();

	return {
		emojis,
		count: emojis.length,
		offset,
		total,
	};
}
