import { escapeRegExp } from '@rocket.chat/string-helpers';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import type { IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

type FindPrioritiesParams = {
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<IOmnichannelServiceLevelAgreements>['sort'];
	};
};

type FindPrioritiesResult = {
	priorities: IOmnichannelServiceLevelAgreements[];
	count: number;
	offset: number;
	total: number;
};

type FindPrioritiesByIdParams = {
	priorityId: string;
};

type FindPrioritiesByIdResult = IOmnichannelServiceLevelAgreements | null;

export async function findPriorities({ text, pagination: { offset, count, sort } }: FindPrioritiesParams): Promise<FindPrioritiesResult> {
	const query = {
		...(text && { $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }),
	};

	const { cursor, totalCount } = await OmnichannelServiceLevelAgreements.findPaginated(query, {
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

export async function findPriorityById({ priorityId }: FindPrioritiesByIdParams): Promise<FindPrioritiesByIdResult> {
	return OmnichannelServiceLevelAgreements.findOneById(priorityId);
}
