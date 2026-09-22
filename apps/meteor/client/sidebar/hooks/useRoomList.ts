import type { ILivechatInquiryRecord, ISidebarCategory } from '@rocket.chat/core-typings';
import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls, useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { filterGroupVisibility, getRoomCategory, useCategoryList } from './useCategoryList';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../views/omnichannel/hooks/useQueuedInquiries';
import { useToggleUnreads } from '../categories/hooks/useToggleUnreads';
import { useUserSidebarCategories } from '../categories/hooks/useUserSidebarCategories';
import { getGroupRooms } from '../lib/groupRooms';
import type { GroupUnreadInfo } from '../lib/unreadRooms';
import { buildUnreadInfo } from '../lib/unreadRooms';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

export type SidebarRoomListGroup = {
	key: string;
	title: string;
	translateTitle: boolean;
	category?: ISidebarCategory;
	showUnreads: boolean;
	keepUnreadsOnTop: boolean;
	collapsed: boolean;
	rooms: SubscriptionWithRoom[];
	unreadInfo: GroupUnreadInfo;
	empty: boolean;
};

type useRoomListReturnType = {
	groups: SidebarRoomListGroup[];
	groupsCount: number[];
	totalCount: number;
};

export const useRoomList = ({ collapsedGroups }: { collapsedGroups?: string[] }): useRoomListReturnType => {
	const showOmnichannel = useOmnichannelEnabled();

	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');

	const { customCategories } = useUserSidebarCategories();
	const { isShowUnreads, isKeepUnreadsOnTop } = useToggleUnreads();

	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);

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

			rooms.forEach((room) => {
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
				const showUnreadsForGroup = hasLicenseModule ? isShowUnreads(key) : false;
				const showUnreads = category ? Boolean(category.showUnreads) : showUnreadsForGroup;
				const keepUnreadsOnTopForGroup = hasLicenseModule ? isKeepUnreadsOnTop(key) : false;
				const keepUnreadsOnTop = category ? Boolean(category.keepUnreadsOnTop) : keepUnreadsOnTopForGroup;
				const allRooms = [...set];
				const { visible: displayRooms, hidden: countedOnlyRooms } = getGroupRooms({
					rooms: allRooms,
					collapsed,
					showUnreads,
					keepUnreadsOnTop,
					openedRoom,
				});

				return {
					key,
					title,
					translateTitle,
					category,
					showUnreads,
					keepUnreadsOnTop,
					collapsed,
					rooms: displayRooms,
					// The header total badge only accounts for what the collapsed group hides. Rooms kept visible
					// while collapsed — the open one, and the unread ones when "Show unreads" is on — carry their
					// own counters, so counting them here as well would duplicate them.
					unreadInfo: buildUnreadInfo(countedOnlyRooms),
					empty: allRooms.length === 0,
				};
			};

			const groups = filterGroupVisibility(unfilteredGroups, hasLicenseModule, makeGroup);

			return groups;
		}, [
			categoryList,
			rooms,
			hasLicenseModule,
			collapsedGroups,
			incomingCalls,
			conferenceWindowEnabled,
			queue,
			customCategories,
			isShowUnreads,
			isKeepUnreadsOnTop,
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
