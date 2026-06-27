import type { ILivechatInquiryRecord, ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserSubscriptions, useSetting } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';
import { useCustomCategories } from '../../views/navigation/hooks/useCustomCategories';
import { useShowUnreadsGroups } from '../../views/navigation/hooks/useShowUnreadsGroups';
import { useSystemGroupsOrder } from '../../views/navigation/hooks/useSystemGroupsOrder';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../views/omnichannel/hooks/useQueuedInquiries';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

const order = [
	'Incoming_Calls',
	'Incoming_Livechats',
	'Open_Livechats',
	'On_Hold_Chats',
	'Unread',
	'Drafts',
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
	/** Collapse/show-unreads identity: translation key for system groups, category id for custom ones. */
	key: string;
	/** Raw title — a translation key for system groups (translate it), the category name for custom ones. */
	title: string;
	translateTitle: boolean;
	category?: ISidebarCustomCategory;
	showUnreads: boolean;
	collapsed: boolean;
	/** Rooms to render — already filtered for collapse + "Show unreads". */
	rooms: SubscriptionWithRoom[];
	unreadInfo: GroupUnreadInfo;
	/** A custom category with no rooms (renders the "drag rooms here" placeholder). */
	empty: boolean;
};

type useRoomListReturnType = {
	groups: SidebarRoomListGroup[];
	groupsCount: number[];
	totalCount: number;
};

const isUnreadRoom = (room: SubscriptionWithRoom): boolean =>
	!room.hideUnreadStatus && Boolean(room.alert || room.unread || room.tunread?.length);

export const useRoomList = ({ collapsedGroups }: { collapsedGroups?: string[] }): useRoomListReturnType => {
	const showOmnichannel = useOmnichannelEnabled();
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const sidebarDrafts = useFeaturePreview('sidebarDrafts');
	const sidebarOrder = useUserPreference<typeof order>('sidebarSectionsOrder') ?? order;
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const { categories: customCategories } = useCustomCategories();
	const { isShowUnreads } = useShowUnreadsGroups();
	const { sortGroups } = useSystemGroupsOrder();

	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	const incomingCalls = useVideoConfIncomingCalls();

	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	return useDebouncedValue(
		useMemo(() => {
			const isCollapsed = (key: string) => collapsedGroups?.includes(key) ?? false;

			const drafts = new Set<SubscriptionWithRoom>();
			const incomingCall = new Set<SubscriptionWithRoom>();
			const favorite = new Set<SubscriptionWithRoom>();
			const team = new Set<SubscriptionWithRoom>();
			const omnichannel = new Set<SubscriptionWithRoom>();
			const unread = new Set<SubscriptionWithRoom>();
			const channels = new Set<SubscriptionWithRoom>();
			const direct = new Set<SubscriptionWithRoom>();
			const discussion = new Set<SubscriptionWithRoom>();
			const conversation = new Set<SubscriptionWithRoom>();
			const onHold = new Set<SubscriptionWithRoom>();

			// Map assigned rooms to their custom category, seeding an (initially empty) set per category.
			const roomToCategory = new Map<string, string>();
			const customSets = new Map<string, Set<SubscriptionWithRoom>>();
			customCategories.forEach((category) => {
				customSets.set(category._id, new Set<SubscriptionWithRoom>());
				category.rooms?.forEach((rid) => roomToCategory.set(rid, category._id));
			});

			rooms.forEach((room) => {
				if (room.archived) {
					return;
				}

				if (incomingCalls.find((call) => call.rid === room.rid)) {
					return incomingCall.add(room);
				}

				// A room in a custom category is shown only there (exclusive with Favorites and system groups).
				const categoryId = roomToCategory.get(room.rid);
				if (categoryId && customSets.has(categoryId)) {
					customSets.get(categoryId)?.add(room);
					return;
				}

				if (sidebarShowUnread && isUnreadRoom(room)) {
					return unread.add(room);
				}

				if (sidebarDrafts && room.draft) {
					return drafts.add(room);
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

			sidebarDrafts && drafts.size && groups.set('Drafts', drafts);

			favoritesEnabled && favorite.size && groups.set('Favorites', favorite);

			sidebarGroupByType && team.size && groups.set('Teams', team);

			sidebarGroupByType && isDiscussionEnabled && discussion.size && groups.set('Discussions', discussion);

			sidebarGroupByType && channels.size && groups.set('Channels', channels);

			sidebarGroupByType && direct.size && groups.set('Direct_Messages', direct);

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
				category?: ISidebarCustomCategory,
			): SidebarRoomListGroup => {
				const collapsed = isCollapsed(key);
				const showUnreads = category ? category.showUnreads !== false : isShowUnreads(key);
				const allRooms = [...set];
				const collapsedRooms = showUnreads ? allRooms.filter(isUnreadRoom) : [];
				const displayRooms = collapsed ? collapsedRooms : allRooms;

				return {
					key,
					title,
					translateTitle,
					category,
					showUnreads,
					collapsed,
					rooms: displayRooms,
					unreadInfo: collapsed ? buildUnreadInfo(set) : emptyUnreadInfo(),
					empty: allRooms.length === 0,
				};
			};

			// Custom categories render first (above the system groups) and persist even when empty.
			const customGroups = customCategories.map((category) =>
				makeGroup(category._id, category.name, false, customSets.get(category._id) ?? new Set<SubscriptionWithRoom>(), category),
			);

			const systemGroups = sortGroups(
				sidebarOrder.reduce<SidebarRoomListGroup[]>((acc, key) => {
					const set = groups.get(key);
					if (set) {
						acc.push(makeGroup(key, key, true, set));
					}
					return acc;
				}, []),
			);

			const allGroups = [...customGroups, ...systemGroups];

			const groupsCount = allGroups.map((group) => {
				// An expanded empty custom category reserves a single row for the "drag rooms here" placeholder.
				if (group.empty) {
					return group.collapsed ? 0 : 1;
				}
				return group.rooms.length;
			});

			return {
				groups: allGroups,
				groupsCount,
				totalCount: groupsCount.reduce((acc, count) => acc + count, 0),
			};
		}, [
			rooms,
			showOmnichannel,
			inquiries.enabled,
			sidebarDrafts,
			queue,
			sidebarShowUnread,
			favoritesEnabled,
			sidebarGroupByType,
			isDiscussionEnabled,
			sidebarOrder,
			collapsedGroups,
			incomingCalls,
			customCategories,
			isShowUnreads,
			sortGroups,
		]),
		50,
	);
};
