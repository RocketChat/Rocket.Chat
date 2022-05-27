import { ILivechatTrigger } from '@rocket.chat/core-typings';
import { PaginatedResult } from '@rocket.chat/rest-typings';
import { SortOptionObject } from 'mongodb';

import { LivechatTrigger } from '../../../../models/server/raw';

type Pagination<T> = { pagination: { offset: number; count: number; sort: SortOptionObject<T> } };
type FindTriggersParams = Pagination<ILivechatTrigger>;
type FindTriggersResult = PaginatedResult<{ triggers: ILivechatTrigger[] }>;

export async function findTriggers({ pagination: { offset, count, sort } }: FindTriggersParams): Promise<FindTriggersResult> {
	const cursor = LivechatTrigger.find(
		{},
		{
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
		},
	);

	const total = await cursor.count();

	const triggers = await cursor.toArray();

	return {
		triggers,
		count: triggers.length,
		offset,
		total,
	};
}

export async function findTriggerById({ triggerId }: { triggerId: string }): Promise<ILivechatTrigger | null> {
	return LivechatTrigger.findOneById(triggerId);
}
