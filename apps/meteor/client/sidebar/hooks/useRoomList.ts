import type { ILivechatInquiryRecord, ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserSubscriptions, useSetting } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';
import { useOpenedRoom } from '../../lib/RoomManager';
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

// Leading icon per system group, so system groups align with custom categories (which use folder/emoji).
const SYSTEM_GROUP_ICONS: Record<string, IconName> = {
	Incoming_Calls: 'phone',
	Incoming_Livechats: 'burger-arrow-left',
	Open_Livechats: 'user-arrow-right',
	On_Hold_Chats: 'pause-unfilled',
	Mentions: 'at',
	Unread: 'flag',
	Unreads: 'flag',
	Drafts: 'pencil',
	Favorites: 'star',
	Teams: 'team',
	Discussions: 'balloons',
	Channels: 'hashtag',
	Direct_Messages: 'at',
	Conversations: 'chat',
};

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
	/** Leading icon: folder for custom categories (overridden by their emoji), the type icon for system groups. */
	icon: IconName;
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

export const isUnreadRoom = (room: SubscriptionWithRoom): boolean =>
	!room.hideUnreadStatus && Boolean(room.alert || room.unread || room.tunread?.length);

// A room with a direct user mention (@you), including thread mentions — for the "Mentions" dynamic category.
// Group mentions (@all/@here) do not count; only rooms where the user is personally mentioned move here.
export const isMentionRoom = (room: SubscriptionWithRoom): boolean =>
	!room.hideUnreadStatus && Boolean(room.userMentions || room.tunreadUser?.length);

/** Ephemeral top-of-sidebar tag filter (not persisted). 'all' shows everything. */
export type SidebarRoomListFilter = 'all' | 'unreads' | 'mentions' | 'drafts';

export const useRoomList = ({
	collapsedGroups,
	filter = 'all',
}: {
	collapsedGroups?: string[];
	filter?: SidebarRoomListFilter;
}): useRoomListReturnType => {
	const showOmnichannel = useOmnichannelEnabled();
	// "System" categories toggle: on = Teams/Channels/Discussions/DMs; off = everything in "Conversations".
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	// "Custom" categories toggle (includes Favorites); default on.
	const showCustom = useUserPreference<boolean>('sidebarShowCustomCategories', true);
	// "Dynamic" category shown first: 'none' | 'mention' (rooms with mentions) | 'unreads' (all unread rooms).
	const sidebarDynamicCategory = useUserPreference<'none' | 'mention' | 'unreads'>('sidebarDynamicCategory', 'none');
	const sidebarDrafts = useFeaturePreview('sidebarDrafts');
	const sidebarOrder = useUserPreference<typeof order>('sidebarSectionsOrder') ?? order;
	const isDiscussionEnabled = useSetting('Discussion_enabled');

	const { categories: customCategories } = useCustomCategories();
	const { isShowUnreads } = useShowUnreadsGroups();
	const { sortGroups } = useSystemGroupsOrder();

	const openedRoom = useOpenedRoom();

	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	const incomingCalls = useVideoConfIncomingCalls();

	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	return useDebouncedValue(
		useMemo(() => {
			const isCollapsed = (key: string) => collapsedGroups?.includes(key) ?? false;

			// Ephemeral tag filter: when active, only matching rooms are shown, empty categories are hidden and
			// every remaining category is expanded momentarily (without touching the user's collapse state).
			const isFiltering = filter !== 'all';
			const matchesFilter = (room: SubscriptionWithRoom): boolean => {
				switch (filter) {
					case 'unreads':
						return isUnreadRoom(room);
					case 'mentions':
						return isMentionRoom(room);
					case 'drafts':
						return Boolean(room.draft);
					default:
						return true;
				}
			};

			const drafts = new Set<SubscriptionWithRoom>();
			const incomingCall = new Set<SubscriptionWithRoom>();
			const favorite = new Set<SubscriptionWithRoom>();
			const team = new Set<SubscriptionWithRoom>();
			const omnichannel = new Set<SubscriptionWithRoom>();
			const unread = new Set<SubscriptionWithRoom>();
			const mentions = new Set<SubscriptionWithRoom>();
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

				// The dynamic category takes precedence over every other grouping: it MOVES matching rooms to the
				// top category, pulling them out of their custom/favorite/system category. "unreads" = all unread
				// rooms; "mention" = only rooms with a direct user mention.
				if (sidebarDynamicCategory === 'unreads' && isUnreadRoom(room)) {
					return unread.add(room);
				}
				if (sidebarDynamicCategory === 'mention' && isMentionRoom(room)) {
					return mentions.add(room);
				}

				// A room in a custom category is shown only there (exclusive with Favorites and system groups).
				// When custom categories are hidden, the room falls through to its system grouping instead.
				const categoryId = roomToCategory.get(room.rid);
				if (showCustom && categoryId && customSets.has(categoryId)) {
					customSets.get(categoryId)?.add(room);
					return;
				}

				if (sidebarDrafts && room.draft) {
					return drafts.add(room);
				}

				// Favorites are part of the "Custom" categories toggle.
				if (showCustom && room.f) {
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

			sidebarDrafts && drafts.size && groups.set('Drafts', drafts);

			showCustom && favorite.size && groups.set('Favorites', favorite);

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
				// While filtering, categories are force-expanded so their matching rooms are visible.
				const collapsed = isFiltering ? false : isCollapsed(key);
				const showUnreads = category ? category.showUnreads !== false : isShowUnreads(key);
				const allRooms = [...set];
				// When collapsed, keep unread rooms (if enabled) plus the currently-open room always visible.
				const collapsedRooms = allRooms.filter((room) => (showUnreads && isUnreadRoom(room)) || room.rid === openedRoom);
				let displayRooms: SubscriptionWithRoom[];
				if (isFiltering) {
					displayRooms = allRooms.filter(matchesFilter);
				} else if (collapsed) {
					displayRooms = collapsedRooms;
				} else {
					displayRooms = allRooms;
				}

				return {
					key,
					title,
					translateTitle,
					icon: category ? 'folder' : (SYSTEM_GROUP_ICONS[key] ?? 'hashtag'),
					category,
					showUnreads,
					collapsed,
					rooms: displayRooms,
					// The header total badge is only useful when the unread rooms are hidden — i.e. collapsed AND
					// "Show unreads" off. With "Show unreads" on, the unread rooms stay visible (with their own
					// counters) even collapsed, so the header acts as when open and shows no badge.
					unreadInfo: collapsed && !showUnreads ? buildUnreadInfo(set) : emptyUnreadInfo(),
					// While filtering, a category with no matching rooms is hidden entirely (no placeholder).
					empty: isFiltering ? displayRooms.length === 0 : allRooms.length === 0,
				};
			};

			// Custom categories render above the system groups and persist even when empty — unless hidden.
			const customGroups = showCustom
				? customCategories.map((category) =>
						makeGroup(category._id, category.name, false, customSets.get(category._id) ?? new Set<SubscriptionWithRoom>(), category),
					)
				: [];

			const systemGroups = sortGroups(
				sidebarOrder.reduce<SidebarRoomListGroup[]>((acc, key) => {
					const set = groups.get(key);
					if (set) {
						acc.push(makeGroup(key, key, true, set));
					}
					return acc;
				}, []),
			);

			// The dynamic category ("Mentions" or "Unread") renders first — its default position, above everything.
			const buildDynamicGroups = (): SidebarRoomListGroup[] => {
				if (sidebarDynamicCategory === 'mention' && mentions.size) {
					return [makeGroup('Mentions', 'Mentions', true, mentions)];
				}
				if (sidebarDynamicCategory === 'unreads' && unread.size) {
					return [makeGroup('Unreads', 'Unreads', true, unread)];
				}
				return [];
			};

			const allGroups = [...buildDynamicGroups(), ...customGroups, ...systemGroups];
			// While filtering, drop categories that ended up with no matching rooms.
			const visibleGroups = isFiltering ? allGroups.filter((group) => !group.empty) : allGroups;

			const groupsCount = visibleGroups.map((group) => {
				// An expanded empty custom category reserves a single row for the "drag rooms here" placeholder.
				if (group.empty) {
					return group.collapsed ? 0 : 1;
				}
				return group.rooms.length;
			});

			return {
				groups: visibleGroups,
				groupsCount,
				totalCount: groupsCount.reduce((acc, count) => acc + count, 0),
			};
		}, [
			rooms,
			showOmnichannel,
			inquiries.enabled,
			sidebarDrafts,
			queue,
			filter,
			sidebarDynamicCategory,
			showCustom,
			sidebarGroupByType,
			isDiscussionEnabled,
			sidebarOrder,
			collapsedGroups,
			incomingCalls,
			customCategories,
			isShowUnreads,
			sortGroups,
			openedRoom,
		]),
		50,
	);
};
