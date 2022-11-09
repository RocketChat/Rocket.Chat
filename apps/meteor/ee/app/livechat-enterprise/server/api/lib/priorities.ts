import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatPriority } from '@rocket.chat/models';
import type { ILivechatPriority } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

type FindPriorityParams = {
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<ILivechatPriority>['sort'];
	};
};

export async function findPriority({
	text,
	pagination: { offset, count, sort },
}: FindPriorityParams): Promise<PaginatedResult<{ priorities: ILivechatPriority[] }>> {
	const query = {
		...(text && { $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }),
	};

	const { cursor, totalCount } = await LivechatPriority.findPaginated(query, {
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

export async function updatePriority(_id: string, data: Pick<ILivechatPriority, 'name'>): Promise<ILivechatPriority> {
	const query = {
		_id,
	};

	const created = await LivechatPriority.findOneAndUpdate(query, { $set: { ...data, dirty: true } }, { returnDocument: 'after' });
	return created.value as ILivechatPriority;
}
