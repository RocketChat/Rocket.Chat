import {
	isDirectMessageRoom,
	isDiscussion,
	isLivechatInquiryRecord,
	isOmnichannelRoom,
	isPrivateRoom,
	isPublicRoom,
	isTeamRoom,
} from '@rocket.chat/core-typings';
import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { useOmnichannelEnabled } from '../../../hooks/omnichannel/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../../hooks/omnichannel/useQueuedInquiries';
import type { GroupedUnreadInfoData, AllGroupsKeys, AllGroupsKeysWithUnread } from '../contexts/RoomsNavigationContext';
import { RoomsNavigationContext, getEmptyUnreadInfo, isUnreadSubscription } from '../contexts/RoomsNavigationContext';
import { useSidePanelFilters } from '../hooks/useSidePanelFilters';
import { useSidePanelParentRid } from '../hooks/useSidePanelParentRid';

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

const updateGroupUnreadInfo = (
	room: SubscriptionWithRoom | ILivechatInquiryRecord,
	current: GroupedUnreadInfoData,
): GroupedUnreadInfoData => {
	if (isLivechatInquiryRecord(room)) {
		return getEmptyUnreadInfo();
	}

	return {
		...current,
		userMentions: current.userMentions + (room.userMentions || 0),
		groupMentions: current.groupMentions + (room.groupMentions || 0),
		tunread: [...current.tunread, ...(room.tunread || [])],
		tunreadUser: [...current.tunreadUser, ...(room.tunreadUser || [])],
		unread: current.unread + (room.unread || (!room.unread && !room.tunread?.length && room.alert ? 1 : 0)),
	};
};

const hasMention = (room: SubscriptionWithRoom) =>
	room.userMentions || room.groupMentions || room.tunreadUser?.length || room.tunreadGroup?.length;

type GroupMap = Map<AllGroupsKeysWithUnread, Set<SubscriptionWithRoom | ILivechatInquiryRecord>>;
type UnreadGroupDataMap = Map<AllGroupsKeys, GroupedUnreadInfoData>;

const useRoomsGroups = (): [GroupMap, UnreadGroupDataMap] => {
	const showOmnichannel = useOmnichannelEnabled();
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const isDiscussionEnabled = useSetting('Discussion_enabled');

	const rooms = useUserSubscriptions(query, sortOptions);

	const inquiries = useQueuedInquiries();
	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	return useDebouncedValue(
		useMemo(() => {
			const groups: GroupMap = new Map();
			showOmnichannel && groups.set('queue', new Set(queue));

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

				if (isUnreadSubscription(room)) {
					// getGroupSet(`${key}_unread`).add(room);

					const currentUnreadData = unreadGroupData.get(key) || getEmptyUnreadInfo();
					const unreadInfo = updateGroupUnreadInfo(room, currentUnreadData);
					unreadGroupData.set(key, unreadInfo);
				}
			};

			rooms.forEach((room) => {
				if (room.archived) {
					return;
				}

				if (hasMention(room)) {
					setGroupRoom('mentions', room);
				}

				if (favoritesEnabled && room.f) {
					setGroupRoom('favorites', room);
				}

				if (isTeamRoom(room)) {
					setGroupRoom('teams', room);
				}

				if (isDiscussionEnabled && isDiscussion(room)) {
					setGroupRoom('discussions', room);
				}

				if ((isPrivateRoom(room) || isPublicRoom(room)) && !isDiscussion(room) && !isTeamRoom(room)) {
					setGroupRoom('channels', room);
				}

				if (isOmnichannelRoom(room) && showOmnichannel) {
					if (room.onHold) {
						return setGroupRoom('onHold', room);
					}

					return setGroupRoom('inProgress', room);
				}

				if (isDirectMessageRoom(room)) {
					setGroupRoom('directMessages', room);
				}

				setGroupRoom('all', room);
			});

			return [groups, unreadGroupData];
		}, [rooms, showOmnichannel, queue, favoritesEnabled, isDiscussionEnabled]),
		50,
	);
};

const RoomsNavigationContextProvider = ({ children }: { children: ReactNode }) => {
	const { currentFilter, setFilter } = useSidePanelFilters();
	const { parentRid } = useSidePanelParentRid();

	const [groups, unreadGroupData] = useRoomsGroups();

	const contextValue = useMemo(() => {
		return {
			currentFilter,
			setFilter,
			groups,
			unreadGroupData,
			parentRid,
		};
	}, [parentRid, currentFilter, setFilter, groups, unreadGroupData]);

	return <RoomsNavigationContext.Provider value={contextValue}>{children}</RoomsNavigationContext.Provider>;
};

export default RoomsNavigationContextProvider;
