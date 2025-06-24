import {
	isDirectMessageRoom,
	isDiscussion,
	isOmnichannelRoom,
	isPrivateRoom,
	isPublicRoom,
	isTeamRoom,
	type ILivechatInquiryRecord,
} from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
// import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';

import { useOmnichannelEnabled } from '../../../hooks/omnichannel/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../../hooks/omnichannel/useQueuedInquiries';
import type { GroupedUnreadInfoData, AllGroupsKeys, AllGroupsKeysWithUnread } from '../contexts/RoomsNavigationContext';
import { RoomsNavigationContext, SIDE_PANEL_GROUPS, SIDE_BAR_GROUPS, getEmptyUnreadInfo } from '../contexts/RoomsNavigationContext';
import { useSidePanelFilters } from '../hooks/useSidePanelFilters';

const query = { open: { $ne: false } };
const sortOptions = { sort: { lm: -1 } } as const;

const emptyQueue: ILivechatInquiryRecord[] = [];

export type useRoomsGroupsReturnType = {
	sideBar: {
		roomList: Array<SubscriptionWithRoom>;
		groupsCount: number[];
		groupsList: TranslationKey[];
		groupedUnreadInfo: GroupedUnreadInfoData[];
	};
};

const updateGroupUnreadInfo = (room: SubscriptionWithRoom, current: GroupedUnreadInfoData): GroupedUnreadInfoData => {
	return {
		...current,
		userMentions: current.userMentions + (room.userMentions || 0),
		groupMentions: current.groupMentions + (room.groupMentions || 0),
		tunread: [...current.tunread, ...(room.tunread || [])],
		tunreadUser: [...current.tunreadUser, ...(room.tunreadUser || [])],
		unread: current.unread + (room.unread || 0),
	};
};

const isUnread = (room: SubscriptionWithRoom | ILivechatInquiryRecord) =>
	'alert' in room && (room.alert || room.unread || room.tunread?.length) && !room.hideUnreadStatus;

const hasMention = (room: SubscriptionWithRoom) => room.userMentions || room.groupMentions || room.tunreadUser || room.tunreadGroup;

type GroupMap = Map<AllGroupsKeysWithUnread, Set<SubscriptionWithRoom | ILivechatInquiryRecord>>;
type UnreadGroupDataMap = Map<AllGroupsKeys, GroupedUnreadInfoData>;

const useRoomsGroups = (): [GroupMap, UnreadGroupDataMap] => {
	const showOmnichannel = useOmnichannelEnabled();
	// const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	// const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const rooms = useUserSubscriptions(query, sortOptions);

	const inquiries = useQueuedInquiries();

	// const incomingCalls = useVideoConfIncomingCalls();

	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	return useDebouncedValue(
		useMemo(() => {
			const groups: GroupMap = new Map();
			showOmnichannel && groups.set(SIDE_PANEL_GROUPS.QUEUE, new Set(queue));

			const unreadGroupData: UnreadGroupDataMap = new Map();

			const setGroupRoom = (key: AllGroupsKeys, room: SubscriptionWithRoom | ILivechatInquiryRecord) => {
				const getGroupSet = (key: AllGroupsKeysWithUnread) => {
					const roomSet = groups.get(key) || new Set<SubscriptionWithRoom | ILivechatInquiryRecord>();
					if (!groups.has(key)) {
						groups.set(key, roomSet);
					}
					return roomSet;
				};

				getGroupSet(key).add(room);

				if (isUnread(room)) {
					getGroupSet(`${key}_unread`).add(room);

					const currentUnreadData = unreadGroupData.get(key) || getEmptyUnreadInfo();
					// TODO: Fix this type casting. We have to handle ILivechatInquiryRecord as well
					const unreadInfo = updateGroupUnreadInfo(room as SubscriptionWithRoom, currentUnreadData);
					unreadGroupData.set(key, unreadInfo);
				}
			};

			rooms.forEach((room) => {
				if (room.archived) {
					return;
				}

				if (hasMention(room)) {
					setGroupRoom(SIDE_PANEL_GROUPS.MENTIONS, room);
				}

				if (favoritesEnabled && room.f) {
					setGroupRoom(SIDE_PANEL_GROUPS.FAVORITES, room);
				}

				if (isTeamRoom(room)) {
					setGroupRoom(SIDE_BAR_GROUPS.TEAMS, room);
				}

				if (isDiscussionEnabled && isDiscussion(room)) {
					setGroupRoom(SIDE_PANEL_GROUPS.DISCUSSIONS, room);
				}

				if ((isPrivateRoom(room) || isPublicRoom(room)) && !isDiscussion(room) && !isTeamRoom(room)) {
					setGroupRoom(SIDE_BAR_GROUPS.CHANNELS, room);
				}

				if (isOmnichannelRoom(room) && showOmnichannel) {
					room.onHold && setGroupRoom(SIDE_PANEL_GROUPS.ON_HOLD, room);
					return setGroupRoom(SIDE_PANEL_GROUPS.IN_PROGRESS, room);
				}

				if (isDirectMessageRoom(room)) {
					setGroupRoom(SIDE_BAR_GROUPS.DIRECT_MESSAGES, room);
				}

				setGroupRoom(SIDE_PANEL_GROUPS.ALL, room);
			});

			return [groups, unreadGroupData];
		}, [rooms, showOmnichannel, queue, favoritesEnabled, isDiscussionEnabled]),
		50,
	);
};

const RoomsNavigationContextProvider = ({ children }: { children: ReactNode }) => {
	const { currentFilter, setFilter } = useSidePanelFilters();

	const [groups, unreadGroupData] = useRoomsGroups();

	const contextValue = useMemo(() => {
		return {
			currentFilter,
			setFilter,
			groups,
			unreadGroupData,
		};
	}, [currentFilter, setFilter, groups, unreadGroupData]);

	return <RoomsNavigationContext.Provider value={contextValue}>{children}</RoomsNavigationContext.Provider>;
};

export default RoomsNavigationContextProvider;
