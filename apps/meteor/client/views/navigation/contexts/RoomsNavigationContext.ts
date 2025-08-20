import { isLivechatInquiryRecord } from '@rocket.chat/core-typings';
import type { ISubscription, ILivechatInquiryRecord, IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { createContext, useContext, useEffect, useMemo } from 'react';

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

export type SidePanelFiltersKeys = 'all' | 'mentions' | 'favorites' | 'discussions' | 'inProgress' | 'queue' | 'onHold';

export const collapsibleFilters: SideBarFiltersKeys[] = ['teams', 'channels', 'directMessages'];
export type SidePanelFiltersUnreadKeys = `${SidePanelFiltersKeys}_unread`;
export type SidePanelFilters = SidePanelFiltersKeys | SidePanelFiltersUnreadKeys;

export type SideBarFiltersKeys = 'teams' | 'channels' | 'directMessages';
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

	return (
		(subscription.userMentions && subscription.userMentions > 0) ||
		(subscription.groupMentions && subscription.groupMentions > 0) ||
		!!(subscription.tunread && subscription.tunread?.length > 0) ||
		!!(subscription.tunreadUser && subscription.tunreadUser?.length > 0) ||
		!!(!subscription.unread && !subscription.tunread?.length && subscription.alert)
	);
};

export const useSidePanelRoomsListTab = (tab: AllGroupsKeys) => {
	const [, unread] = useSidePanelFilter();
	const roomSet = useRoomsListContext().groups.get(tab);
	console.log(getFilterKey(tab, unread));

	console.log(roomSet);

	const roomsList = useMemo(() => {
		if (!roomSet) {
			return [];
		}

		return unread
			? Array.from(roomSet).sort((a, b) => {
					// if (isLivechatInquiryRecord(a) && isLivechatInquiryRecord(b)) {
					// 	return 0;
					// }

					if (!isLivechatInquiryRecord(a) && !isLivechatInquiryRecord(b)) {
						return (isUnreadSubscription(b) ? 1 : 0) - (isUnreadSubscription(a) ? 1 : 0);
					}

					return 0;
				})
			: Array.from(roomSet);
	}, [roomSet, unread]);
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
