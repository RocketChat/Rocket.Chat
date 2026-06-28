import {
	type ISidebarCustomCategory,
	type ISubscription,
	type ILivechatInquiryRecord,
	type IRoom,
	isTeamRoom,
	isDirectMessageRoom,
} from '@rocket.chat/core-typings';
import { useStableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import { isTruthy } from '@rocket.chat/tools';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOpenedRoom } from '../../../lib/RoomManager';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { useShowUnreadsGroups } from '../hooks/useShowUnreadsGroups';
import { useSystemGroupsOrder } from '../hooks/useSystemGroupsOrder';

export const sidePanelFiltersConfig: { [Key in AllGroupsKeys]: { title: TranslationKey; icon: IconName } } = {
	all: {
		title: 'All',
		icon: 'inbox',
	},
	favorites: {
		title: 'Favorites',
		icon: 'star',
	},
	mentions: {
		title: 'Mentions',
		icon: 'at',
	},
	discussions: {
		title: 'Discussions',
		icon: 'balloons',
	},
	inProgress: {
		title: 'In_progress',
		icon: 'user-arrow-right',
	},
	queue: {
		title: 'Queue',
		icon: 'burger-arrow-left',
	},
	onHold: {
		title: 'On_Hold',
		icon: 'pause-unfilled',
	},
	teams: {
		title: 'Teams',
		icon: 'team',
	},
	channels: {
		title: 'Channels',
		icon: 'hashtag',
	},
	directMessages: {
		title: 'Direct_Messages',
		icon: 'at',
	},
	unread: {
		title: 'Unread',
		icon: 'flag',
	},
	conversations: {
		title: 'Conversations',
		icon: 'chat',
	},
};

export type SidePanelFiltersKeys = 'all' | 'mentions' | 'favorites' | 'discussions' | 'inProgress' | 'queue' | 'onHold';

export const collapsibleFilters: SideBarFiltersKeys[] = ['unread', 'conversations', 'teams', 'channels', 'directMessages'];
export type SidePanelFiltersUnreadKeys = `${SidePanelFiltersKeys}_unread`;
export type SidePanelFilters = SidePanelFiltersKeys | SidePanelFiltersUnreadKeys;

export type SideBarFiltersKeys = 'teams' | 'channels' | 'directMessages' | 'conversations' | 'unread';
export type SideBarFiltersUnreadKeys = `${SideBarFiltersKeys}_unread`;
export type SideBarFilters = SidePanelFiltersKeys | SidePanelFiltersUnreadKeys;

export type AllGroupsKeys = SidePanelFiltersKeys | SideBarFiltersKeys;

export type AllGroupsKeysWithUnread = SidePanelFilters | SideBarFiltersKeys | SideBarFiltersUnreadKeys;

export type RecordTypeBySidebarKey<K extends AllGroupsKeysWithUnread> = K extends 'queue' ? ILivechatInquiryRecord : SubscriptionWithRoom;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface RoomsNavigationGroup extends Map<AllGroupsKeysWithUnread, Set<RecordTypeBySidebarKey<AllGroupsKeysWithUnread>>> {
	get<K extends AllGroupsKeysWithUnread>(key: K): Set<RecordTypeBySidebarKey<K>> | undefined;
}

export type RoomsNavigationContextValue = {
	groups: RoomsNavigationGroup;
	currentFilter: AllGroupsKeysWithUnread;
	setFilter: (filter: AllGroupsKeys, unread: boolean, parentRid?: IRoom['_id']) => void;
	unreadGroupData: Map<AllGroupsKeys, GroupedUnreadInfoData>;
	customCategories: ISidebarCustomCategory[];
	customGroups: Map<string, Set<SubscriptionWithRoom>>;
	customUnreadData: Map<string, GroupedUnreadInfoData>;
	parentRid?: IRoom['_id'];
};

export type GroupedUnreadInfoData = {
	userMentions: number;
	groupMentions: number;
	tunread: string[];
	tunreadUser: string[];
	unread: number;
};

export const RoomsNavigationContext = createContext<RoomsNavigationContextValue | undefined>(undefined);

export const useRoomsListContext = () => {
	const contextValue = useContext(RoomsNavigationContext);

	if (!contextValue) {
		throw new Error('useRoomsListContext must be used within a RoomsNavigationContext');
	}

	return contextValue;
};

// Helper functions
export const splitFilter = (currentFilter: AllGroupsKeysWithUnread): [SidePanelFiltersKeys, boolean] => {
	const [currentTab, unread] = currentFilter.split('_');
	return [currentTab as SidePanelFiltersKeys, unread === 'unread'];
};

export const getFilterKey = (tab: AllGroupsKeys, unread: boolean): AllGroupsKeysWithUnread => {
	return unread ? `${tab}_unread` : tab;
};

export const getEmptyUnreadInfo = (): GroupedUnreadInfoData => ({
	userMentions: 0,
	groupMentions: 0,
	tunread: [],
	tunreadUser: [],
	unread: 0,
});

// Hooks

/**
 * A renderable section of the sidebar room list. Either a system/standard group (Teams, Channels, …)
 * or a user-defined custom category (`category` is set).
 */
export type SideBarRoomListItem = {
	/** Group key: a system filter key or a custom category id. Used for collapse state and DnD. */
	key: string;
	/** Resolved display title (translated for system groups, raw name for custom categories). */
	title: string;
	icon: IconName;
	/** Rooms to render — already filtered for collapse + "Show unreads" behavior. */
	rooms: SubscriptionWithRoom[];
	unreadInfo: GroupedUnreadInfoData;
	collapsed: boolean;
	showUnreads: boolean;
	/** True for a custom category that currently has no rooms (renders the "drag rooms here" placeholder). */
	empty: boolean;
	category?: ISidebarCustomCategory;
};

const getDisplayRooms = (
	rooms: SubscriptionWithRoom[],
	collapsed: boolean,
	showUnreads: boolean,
	openedRoom: string | undefined,
): SubscriptionWithRoom[] => {
	if (!collapsed) {
		return rooms;
	}
	// When collapsed, keep unread rooms (if enabled) plus the currently-open room always visible.
	return rooms.filter((room) => (showUnreads && isUnreadSubscription(room)) || room.rid === openedRoom);
};

export const useSideBarRoomsList = (): {
	roomListGroups: SideBarRoomListItem[];
	groupCounts: number[];
	totalCount: number;
} & ReturnType<typeof useCollapsedGroups> => {
	const { t } = useTranslation();
	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { isShowUnreads } = useShowUnreadsGroups();
	const { sortGroups } = useSystemGroupsOrder();
	const { groups, unreadGroupData, customCategories, customGroups, customUnreadData } = useRoomsListContext();

	const openedRoom = useOpenedRoom();

	// Custom categories render first (above the system groups) and persist even when empty.
	const customItems: SideBarRoomListItem[] = customCategories.map((category) => {
		const roomSet = customGroups.get(category._id);
		const rooms = roomSet ? Array.from(roomSet) : [];
		const collapsed = collapsedGroups.includes(category._id);
		const showUnreads = category.showUnreads !== false;

		return {
			key: category._id,
			title: category.name,
			icon: 'folder',
			rooms: getDisplayRooms(rooms, collapsed, showUnreads, openedRoom),
			unreadInfo: customUnreadData.get(category._id) || getEmptyUnreadInfo(),
			collapsed,
			showUnreads,
			empty: rooms.length === 0,
			category,
		};
	});

	const systemItems: SideBarRoomListItem[] = collapsibleFilters
		.map((group): SideBarRoomListItem | undefined => {
			const roomSet = (groups as Map<SideBarFiltersKeys, Set<SubscriptionWithRoom>>).get(group);
			const rooms = roomSet ? Array.from(roomSet) : [];

			if (!rooms.length) {
				return undefined;
			}

			const collapsed = collapsedGroups.includes(group);
			const showUnreads = isShowUnreads(group);

			return {
				key: group,
				title: t(sidePanelFiltersConfig[group].title),
				icon: sidePanelFiltersConfig[group].icon,
				rooms: getDisplayRooms(rooms, collapsed, showUnreads, openedRoom),
				unreadInfo: unreadGroupData.get(group) || getEmptyUnreadInfo(),
				collapsed,
				showUnreads,
				empty: false,
			};
		})
		.filter(isTruthy);

	const roomListGroups = [...customItems, ...sortGroups(systemItems)];

	const groupCounts = roomListGroups.map((group) => {
		// An expanded empty custom category reserves a single row for the "drag rooms here" placeholder.
		if (group.empty) {
			return group.collapsed ? 0 : 1;
		}
		return group.rooms.length;
	});

	return {
		collapsedGroups,
		handleClick,
		handleKeyDown,
		roomListGroups,
		groupCounts,
		totalCount: groupCounts.reduce((acc, count) => acc + count, 0),
	};
};

export const isUnreadSubscription = (subscription: Partial<ISubscription>): boolean => {
	if (subscription.hideUnreadStatus) {
		return false;
	}

	return Boolean(
		subscription.userMentions ||
			subscription.groupMentions ||
			subscription.tunread?.length ||
			subscription.tunreadUser?.length ||
			subscription.unread ||
			subscription.alert,
	);
};

export const useSidePanelQueueListTab = (): Array<ILivechatInquiryRecord> => {
	return Array.from(useRoomsListContext().groups.get('queue') || []);
};

export const useSidePanelRoomsListTab = <K extends Exclude<AllGroupsKeys, 'queue'>>(tab: K): Array<RecordTypeBySidebarKey<K>> => {
	const [, unread] = useSidePanelFilter();
	const roomSet = useRoomsListContext().groups.get(tab);

	const roomsList = useMemo(() => {
		if (!roomSet) {
			return [];
		}

		if (!unread) {
			return Array.from(roomSet);
		}

		return Array.from(roomSet)
			.reduce(
				(result, room) => {
					if (isUnreadSubscription(room)) {
						result[0].push(room);
						return result;
					}

					result[1].push(room);
					return result;
				},
				[[], []] as [Array<RecordTypeBySidebarKey<K>>, Array<RecordTypeBySidebarKey<K>>],
			)
			.flat();
	}, [roomSet, unread]);
	return roomsList;
};

export const useSidePanelFilter = (): [AllGroupsKeys, boolean, AllGroupsKeysWithUnread, (filter: AllGroupsKeysWithUnread) => void] => {
	const [currentFilter, setCurrentFilter] = useLocalStorage<AllGroupsKeysWithUnread>('sidePanelFilters', getFilterKey('all', false));
	return [...splitFilter(currentFilter), currentFilter, setCurrentFilter];
};

export const useUnreadOnlyToggle = (): [boolean, () => void] => {
	const { setFilter, parentRid } = useRoomsListContext();
	const [currentTab, unread] = useSidePanelFilter();

	return [unread, useStableCallback(() => setFilter(currentTab, !unread, parentRid))];
};

export const useSwitchSidePanelTab = () => {
	const { setFilter } = useRoomsListContext();
	const [, unread] = useSidePanelFilter();

	return (tab: AllGroupsKeys, { parentRid }: { parentRid?: IRoom['_id'] } = {}) => {
		setFilter(tab, unread, parentRid);
	};
};

export const useUnreadGroupData = (key: SidePanelFiltersKeys) => useRoomsListContext().unreadGroupData.get(key) || getEmptyUnreadInfo();

export const useIsRoomFilter = () => {
	const [currentTab] = useSidePanelFilter();
	return useMemo(() => collapsibleFilters.some((group) => currentTab === group), [currentTab]);
};

export const useRedirectToDefaultTab = (shouldRedirect: boolean) => {
	const switchSidePanelTab = useSwitchSidePanelTab();

	useEffect(() => {
		if (shouldRedirect) {
			switchSidePanelTab('all');
		}
	}, [shouldRedirect, switchSidePanelTab]);
};

export const useRedirectToFilter = () => {
	const switchSidePanelTab = useSwitchSidePanelTab();

	const handleRedirect = useCallback(
		(room: SubscriptionWithRoom) => {
			if (isTeamRoom(room)) {
				switchSidePanelTab('teams', { parentRid: room.rid });
				return;
			}

			if (isDirectMessageRoom(room)) {
				switchSidePanelTab('directMessages', { parentRid: room.rid });
				return;
			}

			switchSidePanelTab('channels', { parentRid: room.prid || room.rid });
		},
		[switchSidePanelTab],
	);

	return handleRedirect;
};
