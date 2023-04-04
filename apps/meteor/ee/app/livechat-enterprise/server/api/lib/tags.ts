import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatTag } from '@rocket.chat/models';
import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

type FindTagsParams = {
	userId: string;
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<ILivechatTag>['sort'];
	};
};

type FindTagsResult = {
	tags: ILivechatTag[];
	count: number;
	offset: number;
	total: number;
};

type FindTagsByIdParams = {
	userId: string;
	tagId: string;
};

type FindTagsByIdResult = ILivechatTag | null;

export async function findTags({ text, pagination: { offset, count, sort } }: FindTagsParams): Promise<FindTagsResult> {
	const query = {
		...(text && { $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }),
	};

	const { cursor, totalCount } = LivechatTag.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [tags, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		tags,
		count: tags.length,
		offset,
		total,
	};
}

export async function findTagById({ tagId }: FindTagsByIdParams): Promise<FindTagsByIdResult> {
	return LivechatTag.findOneById(tagId);
}
