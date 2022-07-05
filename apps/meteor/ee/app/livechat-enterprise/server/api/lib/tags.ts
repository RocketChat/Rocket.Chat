import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatTag } from '@rocket.chat/models';
import { ILivechatTag } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';

type FindTagsParams = {
	userId: string;
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: object;
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

export async function findTags({ userId, text, pagination: { offset, count, sort } }: FindTagsParams): Promise<FindTagsResult> {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-tags')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	const query = {
		...(text && { $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }),
	};

	const cursor = LivechatTag.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const tags = await cursor.toArray();

	return {
		tags,
		count: tags.length,
		offset,
		total,
	};
}

export async function findTagById({ userId, tagId }: FindTagsByIdParams): Promise<FindTagsByIdResult> {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-tags')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	return LivechatTag.findOneById(tagId);
}
