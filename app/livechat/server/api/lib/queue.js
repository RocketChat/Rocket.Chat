import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatRooms } from '../../../../models/server/raw';

export async function findQueueMetrics({ userId, agentId, includeOfflineAgents, departmentId, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const queue = await LivechatRooms.getQueueMetrics({
		departmentId,
		agentId,
		includeOfflineAgents,
		options: {
			sort: sort || { chats: -1 },
			offset,
			count,
		},
	});
	const total = (await LivechatRooms.getQueueMetrics({ departmentId, agentId, includeOfflineAgents })).length;

	return {
		queue,
		count: queue.length,
		offset,
		total,
	};
}
