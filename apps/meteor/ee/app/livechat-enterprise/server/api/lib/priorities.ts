import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatPriority } from '@rocket.chat/models';
import type { ILivechatPriority, ILivechatPriorityData } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';
import { ObjectId } from 'mongodb';

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

	const [priorities, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		priorities,
		count: priorities.length,
		offset,
		total,
	};
}

export async function findPriorityById({ priorityId }: FindPriorityByIdParams): Promise<FindPriorityByIdResult> {
	return LivechatPriority.findOneById(priorityId);
}

export async function createPriority(data: ILivechatPriorityData): Promise<ILivechatPriority> {
	const query = {
		name: data.name,
	};
	const created = await LivechatPriority.findOneAndUpdate(
		query,
		{ $setOnInsert: { ...data, _id: new ObjectId().toString() } },
		{ upsert: true, returnDocument: 'after' },
	);
	if (created.value != null && created.lastErrorObject?.updatedExisting === true) {
		throw new Error(`priority-already exists`);
	}
	return created.value as ILivechatPriority;
}

export async function deletePriorityById(priorityId: string): Promise<void> {
	const result = await LivechatPriority.removeById(priorityId);
	if (!result.acknowledged) {
		throw new Error(`error-deleting-priority`);
	}
	if (result.deletedCount < 1) {
		throw new Error(`priority-not-found`);
	}
}
