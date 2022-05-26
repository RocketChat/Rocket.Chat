import { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { PaginatedResult } from '@rocket.chat/rest-typings';
import { SortOptionObject } from 'mongodb';

import { LivechatRooms } from '../../../../models/server/raw';

type Pagination<T> = { pagination: { offset: number; count: number; sort: SortOptionObject<T> } };
type FindQueueMetricsParams = {
	departmentId?: string;
	agentId?: string;
	includeOfflineAgents?: boolean;
} & Pagination<IOmnichannelRoom>;

type QueueMetricsResult = PaginatedResult<{
	queue: {
		chats: number;
		department: { _id: string; name: string };
		user: { _id: string; username: string; status: string };
	}[];
}>;

export async function findQueueMetrics({
	agentId,
	includeOfflineAgents,
	departmentId,
	pagination: { offset, count, sort },
}: FindQueueMetricsParams): Promise<QueueMetricsResult> {
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
