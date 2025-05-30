import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
// import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';

import { useOmnichannelEnabled } from '../../../hooks/omnichannel/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../../hooks/omnichannel/useQueuedInquiries';
import { useSortQueryOptions } from '../../../hooks/useSortQueryOptions';
import { RoomsNavigationContext, SIDE_PANEL_GROUPS, SIDE_BAR_GROUPS } from '../contexts/RoomsNavigationContext';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { useSidePanelFilters } from '../hooks/useSidePanelFilters';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

export type GroupedUnreadInfoData = {
	userMentions: number;
	groupMentions: number;
	tunread: string[];
	tunreadUser: string[];
	unread: number;
};

export type useRoomsGroupsReturnType = {
	sideBar: {
		roomList: Array<SubscriptionWithRoom>;
		groupsCount: number[];
		groupsList: TranslationKey[];
		groupedUnreadInfo: GroupedUnreadInfoData[];
	};
	sidePanel: {
		roomList: { [key: string]: SubscriptionWithRoom[] };
		groupedUnreadInfo: { [key: string]: GroupedUnreadInfoData };
	};
};

const getUnreadInfo = (groupData: Set<any>, showUnreadInfo = true) => {
	const groupedUnreadInfoAcc = {
		userMentions: 0,
		groupMentions: 0,
		tunread: [],
		tunreadUser: [],
		unread: 0,
	};

	if (!showUnreadInfo) {
		return groupedUnreadInfoAcc;
	}

	const groupedUnreadInfo = [...groupData].reduce(
		(counter, { userMentions, groupMentions, tunread, tunreadUser, unread, alert, hideUnreadStatus }) => {
			if (hideUnreadStatus) {
				return counter;
			}

			counter.userMentions += userMentions || 0;
			counter.groupMentions += groupMentions || 0;
			counter.tunread = [...counter.tunread, ...(tunread || [])];
			counter.tunreadUser = [...counter.tunreadUser, ...(tunreadUser || [])];
			counter.unread += unread || 0;
			!unread && !tunread?.length && alert && (counter.unread += 1);
			return counter;
		},
		groupedUnreadInfoAcc,
	);

	return groupedUnreadInfo;
};

const isUnread = (room: SubscriptionWithRoom) => (room.alert || room.unread || room.tunread?.length) && !room.hideUnreadStatus;

const hasMention = (room: SubscriptionWithRoom) => room.userMentions || room.groupMentions || room.tunreadUser || room.tunreadGroup;

export const useSidePanelGroups = ({ onlyUnReads }: { onlyUnReads?: boolean }) => {
	const groups = useRoomsGroups();

	const { roomList, groupedUnreadInfo } = useMemo(
		() =>
			Object.values(SIDE_PANEL_GROUPS).reduce(
				(acc, groupTitle) => {
					const value = groups.get(groupTitle) || new Set();

					const roomList = onlyUnReads ? [...value].filter((room) => isUnread(room)) : [...value];
					const groupedUnreadInfo = getUnreadInfo(value);

					acc.groupedUnreadInfo[groupTitle] = groupedUnreadInfo;
					acc.roomList[groupTitle] = roomList;
					return acc;
				},
				{
					roomList: {},
					groupedUnreadInfo: {},
				} as useRoomsGroupsReturnType['sidePanel'],
			),
		[groups, onlyUnReads],
	);

	return { roomList, groupedUnreadInfo };
};

export const useSideBarGroups = ({ collapsedGroups }: { collapsedGroups?: string[] }) => {
	const groups = useRoomsGroups();

	// // We'll need to replace this preference in the database
	// const sidebarOrder = useUserPreference<typeof sideBarGroups>('sidebarSectionsOrder') ?? sideBarGroups;
	const sidebarOrder = Object.values(SIDE_BAR_GROUPS);

	const { groupsCount, groupsList, roomList, groupedUnreadInfo } = useMemo(
		() =>
			sidebarOrder.reduce(
				(acc, groupTitle) => {
					const isCollapsed = collapsedGroups?.includes(groupTitle);
					const value = groups.get(groupTitle);

					if (!value) {
						return acc;
					}

					acc.groupsList.push(groupTitle as TranslationKey);
					const groupedUnreadInfo = getUnreadInfo(value, isCollapsed);

					acc.groupedUnreadInfo.push(groupedUnreadInfo);
					acc.groupsCount.push(isCollapsed ? 0 : value.size);
					acc.roomList.push(...value);
					return acc;
				},
				{
					groupsCount: [],
					groupsList: [],
					roomList: [],
					groupedUnreadInfo: [],
				} as useRoomsGroupsReturnType['sideBar'],
			),
		[collapsedGroups, groups, sidebarOrder],
	);

	return { groupsCount, groupsList, roomList, groupedUnreadInfo };
};

const useRoomsGroups = (): Map<string, Set<any>> => {
	const showOmnichannel = useOmnichannelEnabled();
	// const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	// const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	// const incomingCalls = useVideoConfIncomingCalls();

	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	const { groups } = useDebouncedValue(
		useMemo(() => {
			// const incomingCall = new Set();
			const starred = new Set<SubscriptionWithRoom>();
			const team = new Set<SubscriptionWithRoom>();
			const omnichannel = new Set<SubscriptionWithRoom>();
			const mentions = new Set<SubscriptionWithRoom>();
			// const unread = new Set();
			const channels = new Set<SubscriptionWithRoom>();
			const direct = new Set<SubscriptionWithRoom>();
			const discussion = new Set<SubscriptionWithRoom>();
			const conversation = new Set<SubscriptionWithRoom>();
			const onHold = new Set<SubscriptionWithRoom>();

			rooms.forEach((room) => {
				if (room.archived) {
					return;
				}

				// if (incomingCalls.find((call) => call.rid === room.rid)) {
				// 	return incomingCall.add(room);
				// }

				// if (sidebarShowUnread && (room.alert || room.unread || room.tunread?.length) && !room.hideUnreadStatus) {
				// 	return unread.add(room);
				// }

				if (favoritesEnabled && room.f) {
					starred.add(room);
				}

				if (room.teamMain) {
					return team.add(room);
				}

				if (isDiscussionEnabled && room.prid) {
					discussion.add(room);
				}

				if (hasMention(room)) {
					mentions.add(room);
				}

				if ((room.t === 'c' || room.t === 'p') && !room.prid) {
					channels.add(room);
				}

				if (room.t === 'l' && room.onHold) {
					return showOmnichannel && onHold.add(room);
				}

				if (room.t === 'l') {
					return showOmnichannel && omnichannel.add(room);
				}

				if (room.t === 'd') {
					direct.add(room);
				}

				conversation.add(room);
			});

			const groups = new Map<string, Set<SubscriptionWithRoom | ILivechatInquiryRecord>>();
			// const sidePanelGroups = new Map<string, Set<any>>();
			// incomingCall.size && groups.set('Incoming_Calls', incomingCall);

			// showOmnichannel && inquiries.enabled && queue.length && groups.set('Queue', queue);
			showOmnichannel && groups.set('Queue', new Set(queue));

			showOmnichannel && omnichannel && groups.set('In_progress', omnichannel);
			showOmnichannel && groups.set('On_Hold', onHold);

			// sidebarShowUnread && unread.size && groups.set('Unread', unread);

			groups.set('All', conversation);
			favoritesEnabled && groups.set('Starred', starred);

			// sidebarGroupByType && isDiscussionEnabled && discussion.size && groups.set('Discussions', discussion);
			isDiscussionEnabled && groups.set('Discussions', discussion);
			groups.set('Mentions', mentions);

			team.size && groups.set('Teams', team);
			channels.size && groups.set('Channels', channels);
			direct.size && groups.set('Direct_Messages', direct);

			return { groups };
		}, [rooms, showOmnichannel, queue, favoritesEnabled, isDiscussionEnabled]),
		50,
	);

	return groups;
};

const RoomsNavigationContextProvider = ({ children }: { children: ReactNode }) => {
	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { currentFilter, setCurrentFilter } = useSidePanelFilters();

	const sidePanel = useSidePanelGroups({ onlyUnReads: currentFilter.onlyUnReads });
	const sideBar = useSideBarGroups({ collapsedGroups });

	const contextValue = useMemo(() => {
		return {
			sidePanel: { ...sidePanel, currentFilter, setCurrentFilter },
			sideBar: { ...sideBar, collapsedGroups, handleClick, handleKeyDown },
		};
	}, [sidePanel, currentFilter, setCurrentFilter, sideBar, collapsedGroups, handleClick, handleKeyDown]);

	return <RoomsNavigationContext.Provider value={contextValue}>{children}</RoomsNavigationContext.Provider>;
};

export default RoomsNavigationContextProvider;
