import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { createContext, useContext, useMemo } from 'react';

import { useCollapsedGroups } from '../hooks/useCollapsedGroups';

export const sidePanelFiltersConfig: { [Key in SidePanelFiltersKeys]: { title: TranslationKey; icon: IconName } } = {
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
		icon: 'balloon',
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
};

export const TEAM_COLLAB_GROUPS = {
	ALL: 'all',
	MENTIONS: 'mentions',
	FAVORITES: 'favorites',
	DISCUSSIONS: 'discussions',
} as const;

export const OMNICHANNEL_GROUPS = {
	IN_PROGRESS: 'inProgress',
	QUEUE: 'queue',
	ON_HOLD: 'onHold',
} as const;

export const SIDE_PANEL_GROUPS = {
	...TEAM_COLLAB_GROUPS,
	...OMNICHANNEL_GROUPS,
} as const;

export const SIDE_BAR_GROUPS = {
	TEAMS: 'Teams',
	CHANNELS: 'Channels',
	DIRECT_MESSAGES: 'Direct_Messages',
} as const;

export const SidebarOrder = [SIDE_BAR_GROUPS.TEAMS, SIDE_BAR_GROUPS.CHANNELS, SIDE_BAR_GROUPS.DIRECT_MESSAGES];

export type SidePanelFiltersKeys = (typeof SIDE_PANEL_GROUPS)[keyof typeof SIDE_PANEL_GROUPS];
export type SidePanelFiltersUnreadKeys = `${SidePanelFiltersKeys}_unread`;
export type SidePanelFilters = SidePanelFiltersKeys | SidePanelFiltersUnreadKeys;

export type SideBarGroupsKeys = (typeof SIDE_BAR_GROUPS)[keyof typeof SIDE_BAR_GROUPS];
export type SideBarGroupsUnreadKeys = `${SideBarGroupsKeys}_unread`;

export type AllGroupsKeys = SidePanelFiltersKeys | SideBarGroupsKeys;

export type AllGroupsKeysWithUnread = SidePanelFilters | SideBarGroupsKeys | SideBarGroupsUnreadKeys;

export type RoomsNavigationContextValue = {
	groups: Map<AllGroupsKeysWithUnread, Set<SubscriptionWithRoom | ILivechatInquiryRecord>>;
	currentFilter: AllGroupsKeysWithUnread;
	setFilter: (filter: SidePanelFiltersKeys, unread: boolean) => void;
	unreadGroupData: Map<AllGroupsKeys, GroupedUnreadInfoData>;
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
const splitFilter = (currentFilter: AllGroupsKeysWithUnread): [SidePanelFiltersKeys, boolean] => {
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
type RoomListGroup = {
	group: AllGroupsKeys;
	rooms: Array<SubscriptionWithRoom | ILivechatInquiryRecord>;
	unreadInfo: GroupedUnreadInfoData;
};

export const useSideBarRoomsList = (): { roomListGroups: RoomListGroup[]; groupCounts: number[]; totalCount: number } & ReturnType<
	typeof useCollapsedGroups
> => {
	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { groups, unreadGroupData } = useRoomsListContext();

	const roomListGroups = SidebarOrder.map((group) => {
		const roomSet = groups.get(group);
		const rooms = roomSet ? Array.from(roomSet) : [];
		const unreadInfo = unreadGroupData.get(group) || getEmptyUnreadInfo();
		return { group, rooms, unreadInfo };
	});

	const groupCounts = roomListGroups.map((group) => {
		if (collapsedGroups.includes(group.group)) {
			return 0;
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

export const useSidePanelRoomsListTab = (tab: AllGroupsKeys) => {
	const [, unread] = useSidePanelFilter();
	const roomSet = useRoomsListContext().groups.get(getFilterKey(tab, unread));
	const roomsList = useMemo(() => {
		if (!roomSet) {
			return [];
		}

		return Array.from(roomSet);
	}, [roomSet]);
	return roomsList;
};

export const useSidePanelFilter = (): [SidePanelFiltersKeys, boolean, AllGroupsKeysWithUnread] => {
	const { currentFilter } = useRoomsListContext();
	return [...splitFilter(currentFilter), currentFilter];
};

export const useUnreadOnlyToggle = (): [boolean, () => void] => {
	const { setFilter } = useRoomsListContext();
	const [currentTab, unread] = useSidePanelFilter();

	return [unread, useEffectEvent(() => setFilter(currentTab, !unread))];
};

export const useSwitchSidePanelTab = () => {
	const { setFilter } = useRoomsListContext();
	const [, unread] = useSidePanelFilter();

	return (tab: SidePanelFiltersKeys) => {
		setFilter(tab, unread);
	};
};

export const useUnreadGroupData = (key: SidePanelFiltersKeys) => useRoomsListContext().unreadGroupData.get(key) || getEmptyUnreadInfo();
