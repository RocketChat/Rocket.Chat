import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { isMentionRoom, isUnreadRoom } from './useRoomList';
import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';

const query = { open: { $ne: false } };

/** Counts for the sidebar filter tags: drafts, unread rooms and rooms with a direct user mention. */
export const useSidebarFilterCounts = (): { drafts: number; unreads: number; mentions: number } => {
	const options = useSortQueryOptions();
	const rooms = useUserSubscriptions(query, options);

	return useMemo(() => {
		let drafts = 0;
		let unreads = 0;
		let mentions = 0;
		rooms.forEach((room) => {
			if (room.archived) {
				return;
			}
			if (room.draft) {
				drafts += 1;
			}
			if (isUnreadRoom(room)) {
				unreads += 1;
			}
			if (isMentionRoom(room)) {
				mentions += 1;
			}
		});
		return { drafts, unreads, mentions };
	}, [rooms]);
};
