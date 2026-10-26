import type { MediaCallHistoryItem, CallHistoryItem, IUser } from '@rocket.chat/core-typings';

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
	/** Fetches the user's history from the external service, when there is one, and tells the user's clients about it. */
	importExternalHistory(uid: IUser['_id']): Promise<void>;
	searchMediaCalls(
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
	): Promise<{ items: MediaCallHistoryItem[]; total: number }>;
}
