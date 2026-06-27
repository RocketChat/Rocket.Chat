import { isDirectMessageRoom, isDiscussion, isOmnichannelRoom, isPrivateRoom, isPublicRoom, isTeamRoom } from '@rocket.chat/core-typings';
import type { ILivechatInquiryRecord, IRoom, ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { useDebouncedValue, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useUserPreference, useUserSubscriptions, useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import { useSortQueryOptions } from '../../../hooks/useSortQueryOptions';
import { RoomManager } from '../../../lib/RoomManager';
import { Rooms } from '../../../stores';
import { useOmnichannelEnabled } from '../../omnichannel/hooks/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../omnichannel/hooks/useQueuedInquiries';
import type {
	GroupedUnreadInfoData,
	AllGroupsKeys,
	AllGroupsKeysWithUnread,
	RoomsNavigationGroup,
} from '../contexts/RoomsNavigationContext';
import {
	RoomsNavigationContext,
	getEmptyUnreadInfo,
	getFilterKey,
	isUnreadSubscription,
	useSidePanelFilter,
} from '../contexts/RoomsNavigationContext';
import { useSidePanelParentRid } from '../hooks/useSidePanelParentRid';

const query = { open: { $ne: false } };

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
		unread: current.unread + (room.unread || (!room.unread && !room.tunread?.length && room.alert ? 1 : 0)),
	};
};

const hasMention = (room: SubscriptionWithRoom) =>
	room.userMentions || room.groupMentions || room.tunreadUser?.length || room.tunreadGroup?.length;

type UnreadGroupDataMap = Map<AllGroupsKeys, GroupedUnreadInfoData>;
type CustomGroupMap = Map<string, Set<SubscriptionWithRoom>>;
type CustomUnreadDataMap = Map<string, GroupedUnreadInfoData>;

const emptyCategories: ISidebarCustomCategory[] = [];

type RoomsGroupsResult = {
	groups: RoomsNavigationGroup;
	unreadGroupData: UnreadGroupDataMap;
	customCategories: ISidebarCustomCategory[];
	customGroups: CustomGroupMap;
	customUnreadData: CustomUnreadDataMap;
};

const useRoomsGroups = (): RoomsGroupsResult => {
	const showOmnichannel = useOmnichannelEnabled();
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const customCategories = useUserPreference<ISidebarCustomCategory[]>('sidebarCustomCategories', emptyCategories) ?? emptyCategories;
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();
	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	const { groups, unreadGroupData, customGroups, customUnreadData } = useDebouncedValue(
		useMemo(() => {
			const groups: RoomsNavigationGroup = new Map();
			showOmnichannel && groups.set('queue', new Set(queue));

			const unreadGroupData: UnreadGroupDataMap = new Map();

			// Map each assigned room to its custom category and seed an (initially empty) set per category,
			// so empty categories still render their "drag rooms here" placeholder.
			const roomToCategory = new Map<string, string>();
			const customGroups: CustomGroupMap = new Map();
			const customUnreadData: CustomUnreadDataMap = new Map();
			customCategories.forEach((category) => {
				customGroups.set(category._id, new Set<SubscriptionWithRoom>());
				category.rooms?.forEach((rid) => roomToCategory.set(rid, category._id));
			});

			const setGroupRoom = (key: AllGroupsKeys, room: SubscriptionWithRoom) => {
				const getGroupSet = (key: AllGroupsKeysWithUnread) => {
					const roomSet = groups.get(key) || new Set<SubscriptionWithRoom>();
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

			const setCustomGroupRoom = (categoryId: string, room: SubscriptionWithRoom) => {
				customGroups.get(categoryId)?.add(room);

				if (isUnreadSubscription(room)) {
					const currentUnreadData = customUnreadData.get(categoryId) || getEmptyUnreadInfo();
					customUnreadData.set(categoryId, updateGroupUnreadInfo(room, currentUnreadData));
				}
			};

			rooms.forEach((room) => {
				if (room.archived) {
					return;
				}

				if (isOmnichannelRoom(room) && showOmnichannel) {
					if (room.onHold) {
						return setGroupRoom('onHold', room);
					}

					return setGroupRoom('inProgress', room);
				}

				setGroupRoom('all', room);

				if (hasMention(room)) {
					setGroupRoom('mentions', room);
				}

				// A room in a custom category is shown only there (exclusive with Favorites and system groups).
				const categoryId = roomToCategory.get(room.rid);
				if (categoryId && customGroups.has(categoryId)) {
					setCustomGroupRoom(categoryId, room);
					return;
				}

				if (room.f) {
					setGroupRoom('favorites', room);
				}

				if (isDiscussionEnabled && isDiscussion(room)) {
					setGroupRoom('discussions', room);
					return;
				}

				if (sidebarShowUnread && isUnreadSubscription(room)) {
					setGroupRoom('unread', room);
					return;
				}

				if (!sidebarGroupByType) {
					setGroupRoom('conversations', room);
					return;
				}

				if (isTeamRoom(room)) {
					setGroupRoom('teams', room);
				}

				if ((isPrivateRoom(room) || isPublicRoom(room)) && !isDiscussion(room) && !isTeamRoom(room)) {
					setGroupRoom('channels', room);
				}

				if (isDirectMessageRoom(room)) {
					setGroupRoom('directMessages', room);
				}
			});

			return { groups, unreadGroupData, customGroups, customUnreadData };
		}, [showOmnichannel, queue, rooms, sidebarShowUnread, sidebarGroupByType, isDiscussionEnabled, customCategories]),
		50,
	);

	return { groups, unreadGroupData, customCategories, customGroups, customUnreadData };
};

const RoomsNavigationContextProvider = ({ children }: { children: ReactNode }) => {
	const {
		sidePanel: { openSidePanel },
	} = useLayout();
	const { setParentRoom, parentRid } = useSidePanelParentRid();

	const [currentFilter, unread, , setCurrentFilter] = useSidePanelFilter();

	const setFilter = useStableCallback((filter: AllGroupsKeys, unread: boolean, parentRid?: IRoom['_id']) => {
		openSidePanel();
		setCurrentFilter(getFilterKey(filter, unread));
		setParentRoom(filter, parentRid);
	});

	const { groups, unreadGroupData, customCategories, customGroups, customUnreadData } = useRoomsGroups();

	const handleRoomOpened = useStableCallback((rid: string) => {
		const room = Rooms.use.getState().find((r) => r._id === rid);

		if (!room) {
			return;
		}

		if (!['teams', 'channels', 'directMessages'].includes(currentFilter)) {
			return;
		}

		if (isTeamRoom(room)) {
			setFilter('teams', unread, rid);
			return;
		}

		if (isDirectMessageRoom(room)) {
			setFilter('directMessages', unread, rid);
			return;
		}

		if (room.teamId && currentFilter === 'teams') {
			const teamRid = Rooms.use.getState().find((r) => Boolean(r.teamId === room.teamId && r.teamMain))?._id;

			/**
			 * if the room is the parent rid is still the same, don't change the filter
			 * the filter decision is going to be done by `useRedirectToFilter` when the item is clicked
			 **/
			if (parentRid === teamRid) {
				return;
			}
			setFilter('teams', unread, teamRid);
			return;
		}

		if (room.prid) {
			const parentRoom = Rooms.use.getState().find((r) => Boolean(r._id === room.prid));
			setFilter(parentRoom?.teamMain ? 'teams' : 'channels', unread, parentRoom?._id);
			return;
		}

		setFilter('channels', unread, rid);
	});

	useEffect(() => RoomManager.on('opened', handleRoomOpened), [handleRoomOpened]);

	const contextValue = useMemo(() => {
		return {
			currentFilter,
			setFilter,
			groups,
			unreadGroupData,
			customCategories,
			customGroups,
			customUnreadData,
			parentRid,
		};
	}, [parentRid, currentFilter, setFilter, groups, unreadGroupData, customCategories, customGroups, customUnreadData]);

	return <RoomsNavigationContext.Provider value={contextValue}>{children}</RoomsNavigationContext.Provider>;
};

export default RoomsNavigationContextProvider;
