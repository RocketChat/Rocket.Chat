import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import { isUnreadRoom } from '../lib/unreadRooms';

/**
 * The opened room, if it was unread when it was opened, for as long as it stays open: the "Unread" group keeps it
 * until the user moves on, instead of dropping it the moment it is read.
 */
export const useStickyUnreadRoom = (openedRoom: string | undefined, rooms: SubscriptionWithRoom[]): string | undefined => {
	const [sticky, setSticky] = useState<{ rid: string | undefined; wasUnread: boolean | undefined }>({
		rid: undefined,
		wasUnread: undefined,
	});

	const room = openedRoom ? rooms.find(({ rid }) => rid === openedRoom) : undefined;

	// Must be decided in the first render that sees the room open and listed: by the next one it may already be read.
	if (sticky.rid !== openedRoom || (sticky.wasUnread === undefined && room)) {
		const next = { rid: openedRoom, wasUnread: room ? isUnreadRoom(room) : undefined };
		setSticky(next);
		return next.wasUnread ? next.rid : undefined;
	}

	return sticky.wasUnread ? sticky.rid : undefined;
};
