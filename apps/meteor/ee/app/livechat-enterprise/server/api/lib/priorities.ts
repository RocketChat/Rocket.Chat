import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatPriority } from '@rocket.chat/models';
import { ILivechatPriority } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';

type FindPrioritiesParams = {
	userId: string;
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: object;
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

	const cursor = LivechatPriority.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const priorities = await cursor.toArray();

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
