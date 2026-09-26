import type { RoomType } from './RoomType';

/** The fields a room's messages can be sorted by. */
export const GetMessagesSortableFields = ['createdAt'] as const;

/** Which of a room's messages to read, and in what order. */
export type GetMessagesOptions = {
	/** How many messages to return at most. */
	limit: number;
	/** How many messages to pass over before returning any. */
	skip: number;
	/** The order to return the messages in. */
	sort: Record<(typeof GetMessagesSortableFields)[number], 'asc' | 'desc'>;
	/** Whether replies inside a thread count, or only the messages in the room itself. */
	showThreadMessages: boolean;
};

/**
 * Filters for querying rooms in the system.
 */
export type GetRoomsFilters = {
	/**
	 * When specified, only rooms matching the provided types will be returned.
	 */
	types?: Array<RoomType>;
	/**
	 * Filter to include or exclude discussion rooms.
	 *
	 * When undefined (default), discussions are included in the result set.
	 *
	 * When true, ONLY discussions are included in the result set (remove non-discussions).
	 * When false, discussion rooms are excluded from the result set.
	 */
	discussions?: boolean;
	/**
	 * Filter to include or exclude team main rooms.
	 *
	 * When undefined (default), team main rooms are included in the result set.
	 *
	 * When true, ONLY team main rooms are included in the result set (remove non-teams).
	 * When false, team main rooms are excluded from the result set.
	 */
	teams?: boolean;
};

/** How much of a room listing to read at a time. */
export type GetRoomsOptions = {
	/** How many rooms to return at most. */
	limit?: number;
	/** How many rooms to pass over before returning any. */
	skip?: number;
};
