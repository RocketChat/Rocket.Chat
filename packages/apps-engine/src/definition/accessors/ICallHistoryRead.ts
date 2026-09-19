import type { CallHistoryDirection, CallHistoryItemState, ICallHistoryItem } from '../callHistory/ICallHistoryItem';

export interface ICallHistorySearchFilters {
	/** Matches the contact's name, username or extension */
	searchTerm?: string;
	direction?: CallHistoryDirection;
	inStates?: Array<CallHistoryItemState>;
}

export interface ICallHistorySearchPagination {
	/** How many entries to return. Defaults to 50, capped at 100. */
	count?: number;
	offset?: number;
	sort?: Record<string, 1 | -1>;
}

export interface ICallHistorySearchResult {
	items: Array<ICallHistoryItem>;
	/** How many entries match the filters, ignoring the pagination */
	total: number;
}

/**
 * This accessor provides methods for accessing
 * call history in a read-only-fashion.
 *
 * Every method reads the history of one user. An app needs the
 * `media-call.history` permission; without it every method returns `undefined`.
 */
export interface ICallHistoryRead {
	/**
	 * Gets a call history entry by its id.
	 *
	 * @param id the id of the entry
	 * @param uid the id of the user the entry belongs to
	 * @returns the entry, or `undefined` when it does not exist
	 */
	getById(id: string, uid: string): Promise<ICallHistoryItem | undefined>;

	/**
	 * Gets a user's call history entry for a call.
	 *
	 * @param callId the id of the call
	 * @param uid the id of the user the entry belongs to
	 * @returns the entry, or `undefined` when it does not exist
	 */
	getByCallId(callId: string, uid: string): Promise<ICallHistoryItem | undefined>;

	/**
	 * Searches a user's call history, newest first.
	 *
	 * @param uid the id of the user whose history to search
	 * @param filters narrows the result down
	 * @param pagination how many entries to return, and from where
	 * @returns the matching entries and the total count
	 */
	search(
		uid: string,
		filters?: ICallHistorySearchFilters,
		pagination?: ICallHistorySearchPagination,
	): Promise<ICallHistorySearchResult | undefined>;
}
