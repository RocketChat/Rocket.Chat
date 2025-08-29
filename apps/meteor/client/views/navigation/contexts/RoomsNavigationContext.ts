import { type ISubscription, type ILivechatInquiryRecord, type IRoom, isTeamRoom, isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

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
type RoomListGroup<T extends AllGroupsKeys> = {
	group: T;
	rooms: Array<T extends SideBarFiltersKeys ? SubscriptionWithRoom : ILivechatInquiryRecord>;
	unreadInfo: GroupedUnreadInfoData;
};

export const useSideBarRoomsList = (): {
	roomListGroups: RoomListGroup<SideBarFiltersKeys>[];
	groupCounts: number[];
	totalCount: number;
} & ReturnType<typeof useCollapsedGroups> => {
	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { groups, unreadGroupData } = useRoomsListContext();

	const roomListGroups = collapsibleFilters
		.map((group) => {
			const roomSet = (groups as Map<SideBarFiltersKeys, Set<SubscriptionWithRoom>>).get(group);
			const rooms = roomSet ? Array.from(roomSet) : [];
			const unreadInfo = unreadGroupData.get(group) || getEmptyUnreadInfo();

			if (!rooms.length) {
				return undefined;
			}

			return { group, rooms, unreadInfo };
		})
		.filter(isTruthy);

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

export const isUnreadSubscription = (subscription: Partial<ISubscription>) => {
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

export const useSidePanelRoomsListTab = (tab: AllGroupsKeys) => {
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
				[[], []] as [Array<SubscriptionWithRoom | ILivechatInquiryRecord>, Array<SubscriptionWithRoom | ILivechatInquiryRecord>],
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
		(room: SubscriptionWithRoom | IRoom) => {
			const roomId = 'rid' in room ? room.rid : room._id;
			if (isTeamRoom(room)) {
				switchSidePanelTab('teams', { parentRid: roomId });
				return;
			}

			if (isDirectMessageRoom(room)) {
				switchSidePanelTab('directMessages', { parentRid: roomId });
				return;
			}

			switchSidePanelTab('channels', { parentRid: room.prid || roomId });
		},
		[switchSidePanelTab],
	);

	return handleRedirect;
};
