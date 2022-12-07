import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatPriority } from '@rocket.chat/models';
import type { ILivechatPriority } from '@rocket.chat/core-typings';
import type { FindOptions, UpdateFilter } from 'mongodb';
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

export async function updatePriority(
	_id: string,
	data: Pick<ILivechatPriority, 'name'> & { reset?: boolean },
): Promise<ILivechatPriority | null> {
	const query = {
		_id,
	};
	const update: Pick<UpdateFilter<ILivechatPriority>, '$set' | '$unset'> = {
		...((data.reset && {
			$set: { dirty: false },
			$unset: { name: 1 },
		}) || {
			$set: { name: data.name, dirty: true },
		}),
	};

	try {
		if (data.name) {
			const priority = await LivechatPriority.findOne({ name: new RegExp(`^${escapeRegExp(data.name)}$`, 'i') });
			if (priority && priority._id !== _id) {
				throw new Error('Error! Priority already exists with this name');
			}
		}

		const created = await LivechatPriority.findOneAndUpdate(query, update, {
			returnDocument: 'after',
		});

		if (!created.ok || !created.value) {
			throw Error('Error updating priority');
		}

		return created.value;
	} catch (error: any) {
		// check if its a duplicate key error
		if (error?.code === 11000) {
			throw new Error('Error! Priority already exists with this name');
		}

		throw error;
	}
}
