import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatTag } from '@rocket.chat/models';
import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { Filter, FindOptions } from 'mongodb';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import { hasAccessToDepartment } from './departments';

type FindTagsParams = {
	userId: string;
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<ILivechatTag>['sort'];
	};
	department?: string;
	viewAll?: boolean;
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

// If viewAll is true, then all tags will be returned, regardless of department
// If viewAll is false, then all public tags will be returned, and
//  if department is specified, then all department tags will be returned
export async function findTags({
	userId,
	text,
	department,
	viewAll,
	pagination: { offset, count, sort },
}: FindTagsParams): Promise<FindTagsResult> {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-tags'))) {
		if (viewAll) {
			viewAll = false;
		}

		if (department) {
			if (!(await hasAccessToDepartment(userId, department))) {
				department = undefined;
			}
		}
	}

	const query: {
		$and?: Filter<ILivechatTag>[];
	} = {
		$and: [
			...(text ? [{ $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }] : []),
			...(!viewAll
				? [
						{
							$or: [{ departments: { $size: 0 } }, ...(department ? [{ departments: department }] : [])],
						},
				  ]
				: []),
		],
	};

	if (!query?.$and?.length) {
		delete query.$and;
	}

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
