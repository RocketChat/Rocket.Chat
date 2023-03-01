import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import { LivechatTrigger } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

export async function findTriggers({
	pagination: { offset, count, sort },
}: {
	pagination: { offset: number; count: number; sort: Record<string, number> };
}): Promise<PaginatedResult<{ triggers: Array<ILivechatTrigger> }>> {
	const { cursor, totalCount } = LivechatTrigger.findPaginated(
		{},
		{
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
		},
	);

	const [triggers, total] = await Promise.all([cursor.toArray(), totalCount]);

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
