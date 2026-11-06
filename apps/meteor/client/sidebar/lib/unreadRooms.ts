import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

export type GroupUnreadInfo = {
	userMentions: number;
	groupMentions: number;
	tunread: string[];
	tunreadUser: string[];
	unread: number;
};

/** Whether a room is asking for attention, which a reader can switch off per room. */
export const isUnreadRoom = (room: SubscriptionWithRoom): boolean =>
	!room.hideUnreadStatus && Boolean(room.alert || room.unread || room.tunread?.length);

export const emptyUnreadInfo = (): GroupUnreadInfo => ({
	userMentions: 0,
	groupMentions: 0,
	tunread: [],
	tunreadUser: [],
	unread: 0,
});

/** What a collapsed group's badge says on behalf of the rooms it hides. */
export const buildUnreadInfo = (rooms: SubscriptionWithRoom[]): GroupUnreadInfo =>
	rooms.reduce<GroupUnreadInfo>((counter, room) => {
		if (room.hideUnreadStatus) {
			return counter;
		}

		counter.userMentions += room.userMentions || 0;
		counter.groupMentions += room.groupMentions || 0;
		counter.tunread = [...counter.tunread, ...(room.tunread || [])];
		counter.tunreadUser = [...counter.tunreadUser, ...(room.tunreadUser || [])];
		counter.unread += room.unread || 0;

		// A room can be flagged as wanting attention without counting anything, and one is still worth saying.
		if (!room.unread && !room.tunread?.length && room.alert) {
			counter.unread += 1;
		}

		return counter;
	}, emptyUnreadInfo());
