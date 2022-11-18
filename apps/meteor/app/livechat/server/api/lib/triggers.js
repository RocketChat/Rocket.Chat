import { LivechatTrigger } from '@rocket.chat/models';

export async function findTriggers({ pagination: { offset, count, sort } }) {
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

export async function findTriggerById({ triggerId }) {
	return LivechatTrigger.findOneById(triggerId);
}
