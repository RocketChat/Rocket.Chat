import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatPriority } from '@rocket.chat/models';
import type { ILivechatPriority } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';

type FindPrioritiesParams = {
	userId: string;
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<ILivechatPriority>['sort'];
	};
};

type FindPrioritiesResult = {
	priorities: ILivechatPriority[];
	count: number;
	offset: number;
	total: number;
};

type FindPrioritiesByIdParams = {
	userId: string;
	priorityId: string;
};

type FindPrioritiesByIdResult = ILivechatPriority | null;

export async function findPriorities({
	userId,
	text,
	pagination: { offset, count, sort },
}: FindPrioritiesParams): Promise<FindPrioritiesResult> {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-priorities')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const query = {
		...(text && { $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }),
	};

	const { cursor, totalCount } = LivechatPriority.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [priorities, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		priorities,
		count: priorities.length,
		offset,
		total,
	};
}

export async function findPriorityById({ userId, priorityId }: FindPrioritiesByIdParams): Promise<FindPrioritiesByIdResult> {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-priorities')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	return LivechatPriority.findOneById(priorityId);
}
