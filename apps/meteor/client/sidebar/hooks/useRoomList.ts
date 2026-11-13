import type { ILivechatInquiryRecord, ISidebarCategory } from '@rocket.chat/core-typings';
import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useIsEnterprise } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls, useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { SIDEBAR_ARCHIVED_GROUP_KEY, filterGroupVisibility, getRoomCategory, useCategoryList } from './useCategoryList';
import type { LiftedActivityFilters } from './useLiftedActivityFilters';
import { useArchivedRooms } from '../../hooks/useArchivedRooms';
import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../views/omnichannel/hooks/useQueuedInquiries';
import { HOUR, useActivityFilterClock, useActivityFilterHours } from '../categories/hooks/useActivityFilter';
import { useToggleUnreads } from '../categories/hooks/useToggleUnreads';
import { useUserSidebarCategories } from '../categories/hooks/useUserSidebarCategories';
import type { GroupUnreadInfo } from '../lib/unreadRooms';
import { buildUnreadInfo, emptyUnreadInfo, isUnreadRoom } from '../lib/unreadRooms';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

export type SidebarRoomListGroup = {
	key: string;
	title: string;
	translateTitle: boolean;
	category?: ISidebarCategory;
	showUnreads: boolean;
	keepUnreadsOnTop: boolean;
	activityFilterHours?: number;
	/** The activity filter hides the unread rooms too, instead of keeping them listed whatever their age. */
	activityFilterHidesUnreads?: boolean;
	/** Rooms the activity filter leaves out of the expanded group, counted whether or not they are being shown. */
	inactiveCount: number;
	showingInactive: boolean;
	collapsed: boolean;
	/** The rooms listed under the header right now, after the collapse and the activity filter. */
	rooms: SubscriptionWithRoom[];
	/** Every room of the group, whatever the collapse or the filter leaves out, for actions on the group as a whole. */
	allRooms: SubscriptionWithRoom[];
	unreadInfo: GroupUnreadInfo;
	empty: boolean;
};

// Quiet rooms by document, so a row keeps its object, and its memo, until the store hands out a new one.
const quietRooms = new WeakMap<SubscriptionWithRoom, SubscriptionWithRoom>();

/**
 * The room with nothing to badge: an archived room asks for no attention, whatever arrives in it. The flags the
 * badges already honour do it, so the counts stay for the row's own menu to offer "Mark read".
 */
const asQuietRoom = (room: SubscriptionWithRoom): SubscriptionWithRoom => {
	const quiet = quietRooms.get(room) ?? { ...room, hideUnreadStatus: true, hideMentionStatus: true };
	quietRooms.set(room, quiet);
	return quiet;
};

/**
 * The group listed last, holding the rooms archived out of the sidebar. Its header always looks like an empty
 * group's and carries no badge, nor do its rooms, so the archive never asks for attention; it starts collapsed.
 * A room stays here, whatever happens in it, until the user unarchives it.
 */
const makeArchivedGroup = (rooms: SubscriptionWithRoom[], collapsed: boolean): SidebarRoomListGroup => ({
	key: SIDEBAR_ARCHIVED_GROUP_KEY,
	title: SIDEBAR_ARCHIVED_GROUP_KEY,
	translateTitle: true,
	showUnreads: false,
	keepUnreadsOnTop: false,
	inactiveCount: 0,
	showingInactive: false,
	collapsed,
	rooms: collapsed ? [] : rooms.map(asQuietRoom),
	allRooms: rooms,
	unreadInfo: emptyUnreadInfo(),
	empty: true,
});

type useRoomListReturnType = {
	groups: SidebarRoomListGroup[];
	groupsCount: number[];
	totalCount: number;
};

/**
 * When the room was last active, as the activity filter judges it: the sidebar's activity date, or for a room
 * that has none (common on old direct messages), the last time the user read, saw or joined it.
 */
export const getLastActivity = (room: SubscriptionWithRoom): number | undefined => {
	const dates = room.lm ? [room.lm] : [room.lr, room.ls, room.ts];
	const times = dates.map((date) => (date ? new Date(date).getTime() : NaN)).filter((time) => Number.isFinite(time));
	return times.length ? Math.max(...times) : undefined;
};

export const useRoomList = ({
	collapsedGroups,
	liftedFilters,
}: {
	collapsedGroups?: string[];
	/** The groups showing their inactive rooms this session, each at the window it was lifted at. */
	liftedFilters?: LiftedActivityFilters;
}): useRoomListReturnType => {
	const showOmnichannel = useOmnichannelEnabled();

	const { data: { isEnterprise = false } = {} } = useIsEnterprise();

	const { customCategories } = useUserSidebarCategories();
	const { isShowUnreads, isKeepUnreadsOnTop } = useToggleUnreads();
	const { getActivityFilterHours, getActivityFilterHidesUnreads, hasActivityFilters } = useActivityFilterHours();
	const now = useActivityFilterClock(hasActivityFilters);

	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);
	const { archivedRoomIds } = useArchivedRooms();

	const inquiries = useQueuedInquiries();

	const categoryList = useCategoryList(showOmnichannel, inquiries.enabled);

	const incomingCalls = useVideoConfIncomingCalls();

	const openedRoom = useOpenedRoom();
	// With the call window, a ringing call is listed with the calls already running, behind the navbar button —
	// so the sidebar keeps no group of its own for it. Reported as no incoming call rather than by dropping the
	// group: `Incoming_Calls` is a dynamic group, so an empty one is left out, and the room stays in whichever
	// group it would otherwise be in.
	const conferenceWindowEnabled = useVideoConfWindowEnabled();

	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	const groups = useDebouncedValue(
		useMemo(() => {
			const isCollapsed = (key: string) => collapsedGroups?.includes(key) ?? false;

			const unfilteredGroups = new Map<string, Set<SubscriptionWithRoom>>();
			categoryList.forEach((category) => {
				unfilteredGroups.set(category, new Set<SubscriptionWithRoom>());
			});

			// An archived room is in no other group, not even Unread: it waits in the archive, quietly.
			const archivedRooms: SubscriptionWithRoom[] = [];

			rooms.forEach((room) => {
				if (isEnterprise && archivedRoomIds.has(room.rid)) {
					archivedRooms.push(room);
					return;
				}

				const roomCategory = getRoomCategory(room, {
					groups: unfilteredGroups,
					hasIncomingCalls: (rid: SubscriptionWithRoom['rid']) => {
						return !conferenceWindowEnabled && !!incomingCalls.find((call) => call.rid === rid);
					},
				});

				if (!roomCategory) {
					return;
				}

				const targetGroup = unfilteredGroups.get(roomCategory);

				if (!targetGroup) {
					return;
				}

				targetGroup.add(room);
			});

			if (unfilteredGroups.has('Incoming_Livechats')) {
				unfilteredGroups.set('Incoming_Livechats', new Set(queue) as unknown as Set<SubscriptionWithRoom>);
			}

			const makeGroup = (key: string, set: Set<SubscriptionWithRoom>): SidebarRoomListGroup => {
				const category = customCategories.find(({ _id }) => _id === key);

				const title = category ? category.name : key;
				const translateTitle = SIDEBAR_SYSTEM_GROUP_KEYS.includes(key as any);
				const collapsed = isCollapsed(key);
				const showUnreadsForGroup = isEnterprise ? isShowUnreads(key) : false;
				const showUnreads = category ? Boolean(category.showUnreads) : showUnreadsForGroup;
				const keepUnreadsOnTopForGroup = isEnterprise ? isKeepUnreadsOnTop(key) : false;
				const keepUnreadsOnTop = category ? Boolean(category.keepUnreadsOnTop) : keepUnreadsOnTopForGroup;
				const activityFilterHours = getActivityFilterHours(key);
				const activityFilterHidesUnreads = getActivityFilterHidesUnreads(key);
				const showingInactive = activityFilterHours !== undefined && liftedFilters?.[key] === activityFilterHours;
				const allRooms = [...set];
				// A collapsed group still shows the room currently open, so the user can locate themselves in the
				// sidebar, plus its unread rooms when "Show unreads" is enabled.
				const isVisibleWhileCollapsed = (room: SubscriptionWithRoom) => room.rid === openedRoom || (showUnreads && isUnreadRoom(room));
				// The activity filter thins out read rooms; unread ones stay listed whatever their age, unless the group
				// asks to hide them too, and the one currently open always stays. A room with no date at all is kept
				// rather than guessed at. The inactive rooms are counted even while they are shown or the group is
				// collapsed, so the chip and the announcement can say how many the filter hides.
				const activeSince = activityFilterHours ? now - activityFilterHours * HOUR : undefined;
				const isInactive = (room: SubscriptionWithRoom) =>
					activeSince !== undefined &&
					room.rid !== openedRoom &&
					(activityFilterHidesUnreads || !isUnreadRoom(room)) &&
					(getLastActivity(room) ?? Infinity) < activeSince;
				const activeRooms: SubscriptionWithRoom[] = [];
				let inactiveCount = 0;
				for (const room of allRooms) {
					if (isInactive(room)) {
						inactiveCount += 1;
					} else {
						activeRooms.push(room);
					}
				}

				let displayRooms = allRooms;
				if (collapsed) {
					displayRooms = allRooms.filter(isVisibleWhileCollapsed);
				} else if (!showingInactive) {
					displayRooms = activeRooms;
				}

				// "Keep unreads on top": stable-partition so unread rooms come first, each partition keeping the
				// configured sort (activity / a-z) it already has from the subscription query.
				if (keepUnreadsOnTop) {
					displayRooms = [...displayRooms.filter(isUnreadRoom), ...displayRooms.filter((room) => !isUnreadRoom(room))];
				}

				return {
					key,
					title,
					translateTitle,
					category,
					showUnreads,
					keepUnreadsOnTop,
					activityFilterHours,
					activityFilterHidesUnreads,
					inactiveCount,
					showingInactive,
					collapsed,
					rooms: displayRooms,
					allRooms,
					// The header total badge only accounts for what the collapsed group hides. Rooms kept visible
					// while collapsed — the open one, and the unread ones when "Show unreads" is on — carry their
					// own counters, so counting them here as well would duplicate them.
					unreadInfo: collapsed ? buildUnreadInfo(allRooms.filter((room) => !isVisibleWhileCollapsed(room))) : emptyUnreadInfo(),
					empty: allRooms.length === 0,
				};
			};

			const groups = filterGroupVisibility(unfilteredGroups, isEnterprise, makeGroup);

			// The archive is offered from the group menus, which need a license; so is its group. Unlike the others
			// it starts collapsed, so the collapsed list, which only records the groups toggled from their start,
			// records it when it is expanded.
			if (isEnterprise) {
				groups.push(makeArchivedGroup(archivedRooms, !isCollapsed(SIDEBAR_ARCHIVED_GROUP_KEY)));
			}

			return groups;
		}, [
			categoryList,
			rooms,
			archivedRoomIds,
			isEnterprise,
			collapsedGroups,
			incomingCalls,
			conferenceWindowEnabled,
			queue,
			customCategories,
			isShowUnreads,
			isKeepUnreadsOnTop,
			getActivityFilterHours,
			getActivityFilterHidesUnreads,
			liftedFilters,
			now,
			openedRoom,
		]),
		50,
	);

	// Group ordering is applied AFTER the debounce so that "Move up / Move down"
	// takes effect immediately rather than waiting for the 50 ms settling period.
	const groupsCount = useMemo(() => groups.map((group) => (group.empty ? 0 : group.rooms.length)), [groups]);

	return {
		groups,
		groupsCount,
		totalCount: useMemo(() => groupsCount.reduce((acc, count) => acc + count, 0), [groupsCount]),
	};
};
