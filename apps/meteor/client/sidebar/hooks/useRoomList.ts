import type { ILivechatInquiryRecord, ISidebarCategory } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserSubscriptions, useSetting } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { useCustomCategories } from './useCustomCategories';
import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../views/omnichannel/hooks/useQueuedInquiries';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

export const SYSTEM_GROUP_KEYS = [
	'Incoming_Calls',
	'Incoming_Livechats',
	'Open_Livechats',
	'On_Hold_Chats',
	'Unread',
	'Favorites',
	'Teams',
	'Discussions',
	'Channels',
	'Direct_Messages',
	'Conversations',
] as const;

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
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference<boolean>('sidebarShowFavorites', true);
	const sidebarOrder = useUserPreference<typeof SYSTEM_GROUP_KEYS>('sidebarSectionsOrder') ?? SYSTEM_GROUP_KEYS;
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread', false);

	const {
		categories: customCategories,
		hasLicenseModule,
		isShowUnreads,
		isKeepUnreadsOnTop,
		sortGroups: sortAllGroups,
	} = useCustomCategories();

	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	const incomingCalls = useVideoConfIncomingCalls();

	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	const unsortedGroups = useDebouncedValue(
		useMemo(() => {
			const isCollapsed = (key: string) => collapsedGroups?.includes(key) ?? false;

			const incomingCall = new Set<SubscriptionWithRoom>();
			const unread = new Set<SubscriptionWithRoom>();
			const favorite = new Set<SubscriptionWithRoom>();
			const team = new Set<SubscriptionWithRoom>();
			const omnichannel = new Set<SubscriptionWithRoom>();
			const channels = new Set<SubscriptionWithRoom>();
			const direct = new Set<SubscriptionWithRoom>();
			const discussion = new Set<SubscriptionWithRoom>();
			const conversation = new Set<SubscriptionWithRoom>();
			const onHold = new Set<SubscriptionWithRoom>();

			const customSets = new Map<string, Set<SubscriptionWithRoom>>();
			customCategories.forEach((category) => {
				customSets.set(category._id, new Set<SubscriptionWithRoom>());
			});

			rooms.forEach((room) => {
				if (room.archived) {
					return;
				}

				if (incomingCalls.find((call) => call.rid === room.rid)) {
					return incomingCall.add(room);
				}

				if (sidebarShowUnread && isUnreadRoom(room)) {
					return unread.add(room);
				}

				if (room.category && customSets.has(room.category)) {
					customSets.get(room.category)?.add(room);
					return;
				}

				if (favoritesEnabled && room.f) {
					return favorite.add(room);
				}

				if (sidebarGroupByType && room.teamMain) {
					return team.add(room);
				}

				if (sidebarGroupByType && isDiscussionEnabled && room.prid) {
					return discussion.add(room);
				}

				if (room.t === 'c' || room.t === 'p') {
					channels.add(room);
				}

				if (room.t === 'l' && room.onHold) {
					return void (showOmnichannel && onHold.add(room));
				}

				if (room.t === 'l') {
					return void (showOmnichannel && omnichannel.add(room));
				}

				if (room.t === 'd') {
					direct.add(room);
				}

				conversation.add(room);
			});

			const groups = new Map<string, Set<SubscriptionWithRoom>>();
			incomingCall.size && groups.set('Incoming_Calls', incomingCall);

			showOmnichannel &&
				inquiries.enabled &&
				queue.length &&
				groups.set('Incoming_Livechats', new Set(queue) as unknown as Set<SubscriptionWithRoom>);
			showOmnichannel && omnichannel.size && groups.set('Open_Livechats', omnichannel);
			showOmnichannel && onHold.size && groups.set('On_Hold_Chats', onHold);

			sidebarShowUnread && unread.size && groups.set('Unread', unread);

			favoritesEnabled && (hasLicenseModule || favorite.size > 0) && groups.set('Favorites', favorite);

			sidebarGroupByType && (hasLicenseModule || team.size > 0) && groups.set('Teams', team);

			sidebarGroupByType && isDiscussionEnabled && (hasLicenseModule || discussion.size > 0) && groups.set('Discussions', discussion);

			sidebarGroupByType && (hasLicenseModule || channels.size > 0) && groups.set('Channels', channels);

			sidebarGroupByType && (hasLicenseModule || direct.size > 0) && groups.set('Direct_Messages', direct);

			!sidebarGroupByType && groups.set('Conversations', conversation);

			const emptyUnreadInfo = (): GroupUnreadInfo => ({ userMentions: 0, groupMentions: 0, tunread: [], tunreadUser: [], unread: 0 });

			const buildUnreadInfo = (set: Set<SubscriptionWithRoom>): GroupUnreadInfo =>
				[...set].reduce<GroupUnreadInfo>((counter, room) => {
					if (room.hideUnreadStatus) {
						return counter;
					}
					counter.userMentions += room.userMentions || 0;
					counter.groupMentions += room.groupMentions || 0;
					counter.tunread = [...counter.tunread, ...(room.tunread || [])];
					counter.tunreadUser = [...counter.tunreadUser, ...(room.tunreadUser || [])];
					counter.unread += room.unread || 0;
					!room.unread && !room.tunread?.length && room.alert && (counter.unread += 1);
					return counter;
				}, emptyUnreadInfo());

			const makeGroup = (
				key: string,
				title: string,
				translateTitle: boolean,
				set: Set<SubscriptionWithRoom>,
				category?: ISidebarCategory,
			): SidebarRoomListGroup => {
				const collapsed = isCollapsed(key);
				const showUnreadsForGroup = hasLicenseModule ? isShowUnreads(key) : false;
				const showUnreads = category ? Boolean(category.showUnreads) : showUnreadsForGroup;
				const keepUnreadsOnTopForGroup = hasLicenseModule ? isKeepUnreadsOnTop(key) : false;
				const keepUnreadsOnTop = category ? Boolean(category.keepUnreadsOnTop) : keepUnreadsOnTopForGroup;
				const allRooms = [...set];
				// When collapsed, keep unread rooms visible if "Show unreads" is enabled.
				const collapsedRooms = allRooms.filter((room) => showUnreads && isUnreadRoom(room));
				let displayRooms = collapsed ? collapsedRooms : allRooms;

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
					// The header total badge is only useful when the unread rooms are hidden — i.e. collapsed AND
					// "Show unreads" off. With "Show unreads" on, the unread rooms stay visible (with their own
					// counters) even collapsed, so the header acts as when open and shows no badge.
					unreadInfo: collapsed && !showUnreads ? buildUnreadInfo(set) : emptyUnreadInfo(),
					empty: allRooms.length === 0,
				};
			};

			const customGroups = customCategories.map((category) =>
				makeGroup(category._id, category.name, false, customSets.get(category._id) ?? new Set<SubscriptionWithRoom>(), category),
			);
			const systemGroups = sidebarOrder.reduce<SidebarRoomListGroup[]>((acc, key) => {
				const set = groups.get(key);
				if (set) {
					acc.push(makeGroup(key, key, true, set));
				}
				return acc;
			}, []);

			return [...customGroups, ...systemGroups];
		}, [
			rooms,
			showOmnichannel,
			inquiries.enabled,
			queue,
			favoritesEnabled,
			sidebarShowUnread,
			sidebarGroupByType,
			isDiscussionEnabled,
			sidebarOrder,
			collapsedGroups,
			incomingCalls,
			customCategories,
			hasLicenseModule,
			isShowUnreads,
			isKeepUnreadsOnTop,
		]),
		50,
	);

	// Group ordering is applied AFTER the debounce so that "Move up / Move down"
	// takes effect immediately rather than waiting for the 50 ms settling period.
	const allGroups = hasLicenseModule ? sortAllGroups(unsortedGroups) : unsortedGroups;
	const groupsCount = allGroups.map((group) => (group.empty ? 0 : group.rooms.length));

	return {
		groups: allGroups,
		groupsCount,
		totalCount: groupsCount.reduce((acc, count) => acc + count, 0),
	};
};
