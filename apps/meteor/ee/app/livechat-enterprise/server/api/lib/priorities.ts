import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatPriority } from '@rocket.chat/models';
import type { ILivechatPriority, ILivechatPriorityData } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

type FindPriorityParams = {
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<ILivechatPriority>['sort'];
	};
};

type FindPriorityResult = {
	priorities: ILivechatPriority[];
	count: number;
	offset: number;
	total: number;
};

type FindPriorityByIdParams = {
	priorityId: string;
};

type FindPriorityByIdResult = ILivechatPriority | null;

export async function findPriority({ text, pagination: { offset, count, sort } }: FindPriorityParams): Promise<FindPriorityResult> {
	const query = {
		...(text && { $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }),
	};

	const { cursor, totalCount } = await LivechatPriority.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [priority, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		priorities: priority,
		count: priority.length,
		offset,
		total,
	};
}

export async function findPriorityById({ priorityId }: FindPriorityByIdParams): Promise<FindPriorityByIdResult> {
	return LivechatPriority.findOneById(priorityId);
}

export async function createPriority(data: ILivechatPriorityData): Promise<ILivechatPriority | false> {
	const exists = await LivechatPriority.findOneByIdOrName(data.name);
	if (exists) {
		return false;
	}
	const insert = await LivechatPriority.insertOne(data);
	if (!insert.acknowledged) {
		return false;
	}
	Object.assign(data, { _id: insert.insertedId });
	return data as ILivechatPriority;
}
