import { LivechatRooms } from '@rocket.chat/models';

export async function findQueueMetrics({ agentId, includeOfflineAgents, departmentId, pagination: { offset, count, sort } }) {
	const result = await LivechatRooms.getQueueMetrics({
		departmentId,
		agentId,
		includeOfflineAgents,
		options: {
			sort: sort || { chats: -1 },
			offset,
			count,
		},
	});

	const {
		sortedResults: queue,
		totalCount: [{ total } = { total: 0 }],
	} = result[0];

	return {
		queue,
		count: queue.length,
		offset,
		total,
	};
}
