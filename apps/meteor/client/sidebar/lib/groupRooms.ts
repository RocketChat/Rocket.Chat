import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { isUnreadRoom } from './unreadRooms';

export type GroupRoomsInput = {
	rooms: SubscriptionWithRoom[];
	collapsed: boolean;
	showUnreads: boolean;
	keepUnreadsOnTop: boolean;
	openedRoom?: string;
};

export type GroupRooms = {
	/** What the group draws, in the order it draws them. */
	visible: SubscriptionWithRoom[];
	/** What it only counts — a room drawn anyway carries its own badge, so counting it twice would say it twice. */
	hidden: SubscriptionWithRoom[];
};

// Partitioned rather than sorted, so each side keeps the order the subscription query already gave it.
const unreadsFirst = (rooms: SubscriptionWithRoom[]): SubscriptionWithRoom[] => [
	...rooms.filter(isUnreadRoom),
	...rooms.filter((room) => !isUnreadRoom(room)),
];

/**
 * Splits a group between the rooms it shows and the rooms it merely speaks for. A collapsed group still
 * shows where the reader is, so they do not lose themselves in a sidebar that just folded under them.
 */
export const getGroupRooms = ({ rooms, collapsed, showUnreads, keepUnreadsOnTop, openedRoom }: GroupRoomsInput): GroupRooms => {
	if (!collapsed) {
		return { visible: keepUnreadsOnTop ? unreadsFirst(rooms) : rooms, hidden: [] };
	}

	const stillShown = (room: SubscriptionWithRoom) => room.rid === openedRoom || (showUnreads && isUnreadRoom(room));
	const visible = rooms.filter(stillShown);

	return {
		visible: keepUnreadsOnTop ? unreadsFirst(visible) : visible,
		hidden: rooms.filter((room) => !stillShown(room)),
	};
};
