import type { ILivechatInquiryRecord, IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { createContext, useContext, useMemo } from 'react';

import { isTruthy } from '../../../../lib/isTruthy';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';

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
	TEAMS: 'teams',
	CHANNELS: 'channels',
	DIRECT_MESSAGES: 'directMessages',
} as const;

export const ALL_GROUPS = {
	...SIDE_PANEL_GROUPS,
	...SIDE_BAR_GROUPS,
} as const;

export const SidebarOrder = [SIDE_BAR_GROUPS.TEAMS, SIDE_BAR_GROUPS.CHANNELS, SIDE_BAR_GROUPS.DIRECT_MESSAGES];

export type SidePanelFiltersKeys = (typeof SIDE_PANEL_GROUPS)[keyof typeof SIDE_PANEL_GROUPS];
export type SidePanelFiltersUnreadKeys = `${SidePanelFiltersKeys}_unread`;
export type SidePanelFilters = SidePanelFiltersKeys | SidePanelFiltersUnreadKeys;

export type SideBarFiltersKeys = (typeof SIDE_BAR_GROUPS)[keyof typeof SIDE_BAR_GROUPS];
export type SideBarFiltersUnreadKeys = `${SideBarFiltersKeys}_unread`;
export type SideBarFilters = SidePanelFiltersKeys | SidePanelFiltersUnreadKeys;

export type AllGroupsKeys = SidePanelFiltersKeys | SideBarFiltersKeys;

export type AllGroupsKeysWithUnread = SidePanelFilters | SideBarFiltersKeys | SideBarFiltersUnreadKeys;

export type RoomsNavigationContextValue = {
	groups: Map<AllGroupsKeysWithUnread, Set<SubscriptionWithRoom | ILivechatInquiryRecord>>;
	currentFilter: AllGroupsKeysWithUnread;
	setFilter: (filter: AllGroupsKeys, unread: boolean, parentRid?: IRoom['_id']) => void;
	unreadGroupData: Map<AllGroupsKeys, GroupedUnreadInfoData>;
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

		if (!rooms.length) {
			return undefined;
		}

		return { group, rooms, unreadInfo };
	}).filter(isTruthy);

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

export const useSidePanelFilter = (): [AllGroupsKeys, boolean, AllGroupsKeysWithUnread] => {
	const { currentFilter } = useRoomsListContext();
	return [...splitFilter(currentFilter), currentFilter];
};

export const useUnreadOnlyToggle = (): [boolean, () => void] => {
	const { setFilter, parentRid } = useRoomsListContext();
	const [currentTab, unread] = useSidePanelFilter();

	return [unread, useEffectEvent(() => setFilter(currentTab, !unread, parentRid))];
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
	return useMemo(() => Object.values(SIDE_BAR_GROUPS).some((group) => currentTab === group), [currentTab]);
};
