import type { CallHistoryItem, IUser } from '@rocket.chat/core-typings';

export interface ICallHistoryService {
	search(
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
	): Promise<{ items: CallHistoryItem[]; total: number }>;
}
