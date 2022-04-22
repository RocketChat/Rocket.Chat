import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatRooms } from '../../../../models/server/raw';

export async function findQueueMetrics({
	userId,
	agentId,
	includeOfflineAgents,
	departmentId,
	pagination,
}: {
	userId: string;
	agentId?: string;
	includeOfflineAgents?: boolean;
	departmentId?: string;
	pagination: { offset: number; count: number; sort: Record<string, unknown> };
}): Promise<{ queue: any[]; count: number; offset: number; total: number }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const result = await LivechatRooms.getQueueMetrics({
		departmentId,
		agentId,
		includeOfflineAgents,
		options: {
			sort: pagination.sort || { chats: -1 },
			offset: pagination.offset,
			count: pagination.count,
		},
	});
	const {
		sortedResults: queue,
		totalCount: [{ total } = { total: 0 }],
	} = result[0];

	return {
		queue,
		count: queue.length,
		offset: pagination.offset,
		total,
	};
}
