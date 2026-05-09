import type { RoomType } from './RoomType';

export const GetMessagesSortableFields = ['createdAt'] as const;

export type GetMessagesOptions = {
	limit: number;
	skip: number;
	sort: Record<(typeof GetMessagesSortableFields)[number], 'asc' | 'desc'>;
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

export type GetRoomsOptions = {
	limit?: number;
	skip?: number;
};
