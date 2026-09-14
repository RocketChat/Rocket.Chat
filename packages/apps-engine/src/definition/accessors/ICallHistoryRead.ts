import type { CallHistoryState, ICallHistoryEntry } from '../callHistory';

/**
 * What to look for when searching the call history.
 *
 * Every field is a narrowing filter, so an empty query matches the whole workspace.
 */
export interface ICallHistoryQuery {
	/** Only calls created at or after this moment. */
	from?: Date;

	/** Only calls created at or before this moment. */
	to?: Date;

	/** Only one user's rows. Omit to search every user's history. */
	uid?: string;

	direction?: 'inbound' | 'outbound';

	/** Only these outcomes. Omit for every outcome. */
	states?: CallHistoryState[];

	/**
	 * How many entries to return. The server caps this, so a larger number is silently
	 * reduced rather than rejected — page through with `offset` and compare against
	 * `total` instead of asking for everything at once.
	 */
	count?: number;

	/** How many entries to skip. Defaults to none. */
	offset?: number;
}

/** One page of history entries, newest call first. */
export interface ICallHistoryPage {
	entries: ICallHistoryEntry[];

	/** How many entries match the query in total, ignoring `count` and `offset`. */
	total: number;

	/** How many entries this page holds — at most the requested `count`. */
	count: number;

	/** How many entries were skipped to build this page. */
	offset: number;
}

/**
 * This accessor provides methods for reading finished calls
 * in a read-only-fashion.
 *
 * Reading any user's history is a privileged action, so every method here requires the
 * `media-call.history` permission. Without it the methods answer as though the history
 * were empty rather than throwing, matching how the other read accessors behave.
 *
 * Two things to know before building a report on this:
 *
 * - **The log is per participant.** An internal call between two workspace users appears
 *   as two entries sharing one `callId`. Deduplicate by `callId` or you will count every
 *   internal call twice.
 * - **Only Rocket.Chat's own calls are visible.** A workspace configured to take its call
 *   history from an external PBX instead is not readable here, and these methods return
 *   nothing at all on such a workspace.
 *
 * @see AppPermissions.mediaCall.history
 */
export interface ICallHistoryRead {
	/**
	 * Gets one entry by the id of the history row.
	 *
	 * @param historyId the id of the history row
	 * @returns the entry, or `undefined` if there is no such row
	 */
	getById(historyId: string): Promise<ICallHistoryEntry | undefined>;

	/**
	 * Gets every entry recorded for one call.
	 *
	 * A call between two workspace users returns two entries — the caller's outbound row
	 * and the callee's inbound row. A call to or from outside the workspace returns one.
	 *
	 * @param callId the id of the call
	 * @returns the entries, or an empty array if the call was never recorded
	 */
	getByCallId(callId: string): Promise<ICallHistoryEntry[]>;

	/**
	 * Searches the whole workspace's call history, newest call first.
	 *
	 * @param query the filters to apply; an empty query matches every recorded call
	 * @returns one page of entries, plus the total number that matched
	 */
	find(query?: ICallHistoryQuery): Promise<ICallHistoryPage>;
}
