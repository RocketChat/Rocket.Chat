import type { ILivechatTag } from '@rocket.chat/core-typings';
import { LivechatTag } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Filter, FindOptions } from 'mongodb';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import { helperLogger } from '../../lib/logger';
import { getDepartmentsWhichUserCanAccess } from './departments';

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

// If viewAll is true
//  -> & user has access to all tags
//      -> then all tags will be returned
//          -> Pages:
//              - Admin > Omnichannel > Tags
//              - Current chat's panel, filter by tags
//              - Canned response creation
//  -> & user does not have access to all tags
//      -> then only public tags will be returned (unauthorized access - no page uses this)
// If viewAll is false
// -> & user has access to all tags
//      -> & department is not specified
//          -> only public tags will be returned (Pages: Close chat modal tag selection for chats not associated with a department being closed by manager)
//      -> & department is specified
//          -> only tags associated with the department will be returned (Page: Close chat modal tag selection for chats associated with a department being closed by manager)
// -> & user does not have access to all tags (same as viewAll = false & user has access to all tags)
//      -> & department is not specified
//          -> only public tags will be returned (Page: Close chat modal tag selection for chats not associated with a department being closed by agent)
//      -> & department is specified
//          -> only tags associated with the department will be returned (Page: Close chat modal tag selection for chats associated with a department being closed by agent)
export async function findTags({
	userId,
	text,
	department,
	viewAll,
	pagination: { offset, count, sort },
}: FindTagsParams): Promise<FindTagsResult> {
	let filteredDepartmentIds: string[] = [];

	if (!(await hasPermissionAsync(userId, 'manage-livechat-tags'))) {
		if (viewAll) {
			viewAll = false;
		}

		// Get a list of all departments this user has access to and only
		// return tags that are associated with those departments
		filteredDepartmentIds = await getDepartmentsWhichUserCanAccess(userId);

		helperLogger.debug({
			msg: 'User does not have permission to manage livechat tags. Filtering tags by departments user has access to.',
			userId,
			accessibleDepartmentsLength: filteredDepartmentIds.length,
			top5AccessibleDepartments: filteredDepartmentIds.slice(0, 5),
		});

		if (department && !filteredDepartmentIds.includes(department)) {
			department = undefined;
		}
	}

	if (department) {
		// In certain cases, the user would only want to see tags for a specific department
		// EG: When closing the chat which is associated with a specific department
		// user get's to choose which tag to use to close the chat
		// (only tags associated with the department should be shown)
		filteredDepartmentIds = [department];
	}

	const query: {
		$and?: Filter<ILivechatTag>[];
	} = {
		$and: [
			...(text ? [{ $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }] : []),
			...(!viewAll
				? [
						{
							$or: [
								{ departments: { $size: 0 } },
								...(filteredDepartmentIds.length ? [{ departments: { $in: filteredDepartmentIds } }] : []),
							],
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
