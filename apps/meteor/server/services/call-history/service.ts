import { ServiceClassInternal, type ICallHistoryService } from '@rocket.chat/core-services';
import type { IUser, CallHistoryItem } from '@rocket.chat/core-typings';
import { CallHistory } from '@rocket.chat/models';

export class CallHistoryService extends ServiceClassInternal implements ICallHistoryService {
	protected name = 'call-history';

	public async search(
		uid: IUser['_id'],
		filters: {
			searchTerm?: string;
			direction?: CallHistoryItem['direction'];
			inStates?: CallHistoryItem['state'][];
		},
		pagination: {
			count: number;
			offset: number;
			sort?: Record<string, 1 | -1>;
		},
	): Promise<{ items: CallHistoryItem[]; total: number }> {
		const { offset, count, sort } = pagination || {};

		const { cursor, totalCount } = CallHistory.findAllByUserIdAndSearchFilters(
			uid,
			{ ...filters },
			{
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
			},
		);
		const [items, total] = await Promise.all([cursor.toArray(), totalCount]);

		return {
			items,
			total,
		};
	}
}
