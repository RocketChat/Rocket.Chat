import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
// import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../hooks/omnichannel/useQueuedInquiries';
import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

const sideBarGroups = ['Teams', 'Channels', 'Direct_Messages'];
const sidePanelGroups = ['All', 'Starred', 'Mentions', 'Discussions', 'In_progress', 'Queue', 'On_Hold'];

export type useRoomListReturnType = {
	sideBar: {
		roomList: Array<SubscriptionWithRoom>;
		groupsCount: number[];
		groupsList: TranslationKey[];
		groupedUnreadInfo: Pick<
			SubscriptionWithRoom,
			'userMentions' | 'groupMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'tunreadGroup' | 'alert' | 'hideUnreadStatus'
		>[];
	};
	sidePanel: {
		roomList: { [key: string]: SubscriptionWithRoom[] };
		groupedUnreadInfo: Pick<
			SubscriptionWithRoom,
			'userMentions' | 'groupMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'tunreadGroup' | 'alert' | 'hideUnreadStatus'
		>[];
	};
};

const groupedUnreadInfoAcc = {
	userMentions: 0,
	groupMentions: 0,
	tunread: [],
	tunreadUser: [],
	unread: 0,
};

const getUnreadInfo = (groupData) => {
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

	return { groupedUnreadInfo };
};

const getSidePanelListData = (groupsData: Map<string, Set<SubscriptionWithRoom>>, groupsOrder: string[]) => {
	const { roomList, groupedUnreadInfo } = groupsOrder.reduce(
		(acc, groupTitle) => {
			const value = groupsData.get(groupTitle);

			if (!value) {
				return acc;
			}

			const { groupedUnreadInfo } = getUnreadInfo(value);
			acc.groupedUnreadInfo.push(groupedUnreadInfo);
			acc.roomList[groupTitle] = [...value];

			return acc;
		},
		{
			roomList: {},
			groupedUnreadInfo: [],
		} as useRoomListReturnType['sidePanel'],
	);

	return { roomList, groupedUnreadInfo };
};

const getSideBarListData = (groupsData: any, groupsOrder: string[], collapsedGroups: any) => {
	const isCollapsed = (groupTitle: string) => collapsedGroups?.includes(groupTitle);

	const { groupsCount, groupsList, roomList, groupedUnreadInfo } = groupsOrder.reduce(
		(acc, key) => {
			const value = groupsData.get(key);

			if (!value) {
				return acc;
			}

			acc.groupsList.push(key as TranslationKey);

			if (isCollapsed(key)) {
				const { groupedUnreadInfo } = getUnreadInfo(value);

				acc.groupedUnreadInfo.push(groupedUnreadInfo);
				acc.groupsCount.push(0);
				return acc;
			}

			acc.groupedUnreadInfo.push(groupedUnreadInfoAcc);
			acc.groupsCount.push(value.size);
			acc.roomList.push(...value);
			return acc;
		},
		{
			groupsCount: [],
			groupsList: [],
			roomList: [],
			groupedUnreadInfo: [],
		} as useRoomListReturnType['sideBar'],
	);

	return { groupsCount, groupsList, roomList, groupedUnreadInfo };
};

type useRoomListProps = {
	collapsedGroups?: string[];
	onlyUnReads?: boolean;
};

const isUnread = (room: SubscriptionWithRoom) => (room.alert || room.unread || room.tunread?.length) && !room.hideUnreadStatus;

export const useRoomList = ({ collapsedGroups, onlyUnReads }: useRoomListProps): useRoomListReturnType => {
	const showOmnichannel = useOmnichannelEnabled();
	// const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const sidebarOrder = useUserPreference<typeof sideBarGroups>('sidebarSectionsOrder') ?? sideBarGroups;
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	// const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	// const incomingCalls = useVideoConfIncomingCalls();

	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	const { sideBar, sidePanel } = useDebouncedValue(
		useMemo(() => {
			// const incomingCall = new Set();
			const starred = new Set();
			const team = new Set();
			const omnichannel = new Set();
			const mentions = new Set();
			// const unread = new Set();
			const channels = new Set();
			const direct = new Set();
			const discussion = new Set();
			const conversation = new Set([]);
			const onHold = new Set([]);

			(onlyUnReads ? rooms.filter((room) => isUnread(room)) : rooms).forEach((room) => {
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
					return starred.add(room);
				}

				if (room.teamMain) {
					return team.add(room);
				}

				if (isDiscussionEnabled && room.prid) {
					return discussion.add(room);
				}

				if (room.userMentions || room.groupMentions) {
					return mentions.add(room);
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

			const groups = new Map<string, Set<any>>();
			// const sidePanelGroups = new Map<string, Set<any>>();

			// incomingCall.size && groups.set('Incoming_Calls', incomingCall);

			showOmnichannel && inquiries.enabled && queue.length && groups.set('Queue', queue);
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

			const sideBar = getSideBarListData(groups, sidebarOrder, collapsedGroups);
			const sidePanel = getSidePanelListData(groups, sidePanelGroups);

			return { sideBar, sidePanel };
		}, [
			rooms,
			showOmnichannel,
			inquiries.enabled,
			queue,
			favoritesEnabled,
			isDiscussionEnabled,
			sidebarOrder,
			collapsedGroups,
			onlyUnReads,
		]),
		50,
	);

	return {
		sideBar,
		sidePanel,
	};
};
