import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';

import { isUnreadRoom } from './useRoomList';
import type { SidebarVirtualListRange } from '../components/SidebarVirtualList';

type RoomsGroup = { rooms: SubscriptionWithRoom[] };

type UnreadRows = {
	unreads: number[];
	mentions: number[];
};

type OffscreenUnread = {
	index: number;
	mention: boolean;
};

type OffscreenUnreads = {
	previous: OffscreenUnread | undefined;
	next: OffscreenUnread | undefined;
};

/** Mentions of the user, directly or in a thread — the ones the room badge flags as a mention. */
const hasUnreadMention = (room: SubscriptionWithRoom): boolean =>
	!room.hideMentionStatus && Boolean(room.userMentions || room.tunreadUser?.length);

/**
 * Row indices of every unread room, and of every room with an unread mention, in the row index space
 * `SidebarVirtualList` uses — each group contributes its header row followed by its rooms.
 *
 * Rooms hidden inside a collapsed group are not in `group.rooms`, so they are not considered here;
 * the group header carries its own badge for those.
 */
export const getUnreadRows = (groups: RoomsGroup[]): UnreadRows => {
	const unreads: number[] = [];
	const mentions: number[] = [];
	let rowIndex = 0;

	groups.forEach((group) => {
		rowIndex += 1;

		group.rooms.forEach((room) => {
			if (isUnreadRoom(room)) {
				unreads.push(rowIndex);
			}

			if (hasUnreadMention(room)) {
				mentions.push(rowIndex);
			}

			rowIndex += 1;
		});
	});

	return { unreads, mentions };
};

const closestBefore = (indices: number[], startIndex: number) => indices.filter((index) => index < startIndex).at(-1);
const closestAfter = (indices: number[], endIndex: number) => indices.find((index) => index > endIndex);

/** In each direction outside the visible range, the nearest mention or, failing that, the nearest unread. */
const pickOffscreen = (mention: number | undefined, unread: number | undefined): OffscreenUnread | undefined => {
	if (mention !== undefined) {
		return { index: mention, mention: true };
	}

	if (unread !== undefined) {
		return { index: unread, mention: false };
	}

	return undefined;
};

export const findOffscreenUnreads = ({ unreads, mentions }: UnreadRows, range: SidebarVirtualListRange): OffscreenUnreads => ({
	previous: pickOffscreen(closestBefore(mentions, range.startIndex), closestBefore(unreads, range.startIndex)),
	next: pickOffscreen(closestAfter(mentions, range.endIndex), closestAfter(unreads, range.endIndex)),
});

const isSameOffscreenUnread = (a: OffscreenUnread | undefined, b: OffscreenUnread | undefined) =>
	a?.index === b?.index && a?.mention === b?.mention;

const isSameOffscreenUnreads = (a: OffscreenUnreads, b: OffscreenUnreads) =>
	isSameOffscreenUnread(a.previous, b.previous) && isSameOffscreenUnread(a.next, b.next);

export const useOffscreenUnreads = ({ groups }: { groups: RoomsGroup[] }) => {
	// Empty until the list reports its first range, so no bubble shows before anything is rendered.
	const [offscreenUnreads, setOffscreenUnreads] = useState<OffscreenUnreads>({ previous: undefined, next: undefined });

	const unreadRows = useMemo(() => getUnreadRows(groups), [groups]);

	// Bails out on an unchanged result, so scrolling only re-renders the list when the nearest offscreen unread changes.
	const handleRangeChange = useStableCallback((range: SidebarVirtualListRange) => {
		const next = findOffscreenUnreads(unreadRows, range);
		setOffscreenUnreads((previous) => (isSameOffscreenUnreads(previous, next) ? previous : next));
	});

	return { previousUnread: offscreenUnreads.previous, nextUnread: offscreenUnreads.next, handleRangeChange };
};
