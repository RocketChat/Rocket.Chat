import type { ILivechatInquiryRecord, ISidebarCategory } from '@rocket.chat/core-typings';
import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { filterGroupVisibility, getRoomCategory, useCategoryList } from './useCategoryList';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../views/omnichannel/hooks/useQueuedInquiries';
import { useToggleUnreads } from '../categories/hooks/useToggleUnreads';
import { useUserSidebarCategories } from '../categories/hooks/useUserSidebarCategories';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

type GroupUnreadInfo = {
	userMentions: number;
	groupMentions: number;
	tunread: string[];
	tunreadUser: string[];
	unread: number;
};

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

export const isUnreadRoom = (room: SubscriptionWithRoom): boolean =>
	!room.hideUnreadStatus && Boolean(room.alert || room.unread || room.tunread?.length);

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
						return !!incomingCalls.find((call) => call.rid === rid);
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

			const emptyUnreadInfo = (): GroupUnreadInfo => ({ userMentions: 0, groupMentions: 0, tunread: [], tunreadUser: [], unread: 0 });

			const buildUnreadInfo = (roomsToCount: SubscriptionWithRoom[]): GroupUnreadInfo =>
				roomsToCount.reduce<GroupUnreadInfo>((counter, room) => {
					if (room.hideUnreadStatus) {
						return counter;
					}

					counter.userMentions += room.userMentions || 0;
					counter.groupMentions += room.groupMentions || 0;
					counter.tunread = [...counter.tunread, ...(room.tunread || [])];
					counter.tunreadUser = [...counter.tunreadUser, ...(room.tunreadUser || [])];
					counter.unread += room.unread || 0;

					if (!room.unread && !room.tunread?.length && room.alert) {
						counter.unread += 1;
					}

					return counter;
				}, emptyUnreadInfo());

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
				// A collapsed group still shows the room currently open, so the user can locate themselves in the
				// sidebar, plus its unread rooms when "Show unreads" is enabled.
				const isVisibleWhileCollapsed = (room: SubscriptionWithRoom) => room.rid === openedRoom || (showUnreads && isUnreadRoom(room));
				let displayRooms = collapsed ? allRooms.filter(isVisibleWhileCollapsed) : allRooms;

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
					collapsed,
					rooms: displayRooms,
					// The header total badge only accounts for what the collapsed group hides. Rooms kept visible
					// while collapsed — the open one, and the unread ones when "Show unreads" is on — carry their
					// own counters, so counting them here as well would duplicate them.
					unreadInfo: collapsed ? buildUnreadInfo(allRooms.filter((room) => !isVisibleWhileCollapsed(room))) : emptyUnreadInfo(),
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
