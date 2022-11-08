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

const defaultPriorities = [
	{
		name: 'Lowest',
		level: 'lowest',
	},
	{
		name: 'Low',
		level: 'low',
	},
	{
		name: 'Medium',
		level: 'medium',
	},
	{
		name: 'High',
		level: 'high',
	},
	{
		name: 'Highest',
		level: 'highest',
	},
];

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

export async function updatePriority(priority: { _id: string; name: string }): Promise<ILivechatPriority> {
	const { _id, name } = priority;
	const query = {
		_id,
	};
	const updated = await LivechatPriority.findOneAndUpdate(query, { $set: { name } }, { returnDocument: 'after' });
	if (updated.value == null) {
		throw new Error(`priority-not-found`);
	}
	return updated.value as ILivechatPriority;
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

export async function arePrioritiesResettable(): Promise<boolean> {
	if ((await LivechatPriority.col.countDocuments()) !== defaultPriorities.length) {
		return true;
	}
	const allFound = await LivechatPriority.find({
		$or: defaultPriorities,
	}).toArray();
	return allFound.length !== defaultPriorities.length;
}

export async function resetPriorities(): Promise<void> {
	if (!(await arePrioritiesResettable())) {
		return;
	}
	await LivechatPriority.col.deleteMany({});
	await LivechatPriority.insertMany(defaultPriorities);
}
