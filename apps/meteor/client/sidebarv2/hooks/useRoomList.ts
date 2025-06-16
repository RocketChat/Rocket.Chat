import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserSubscriptions, useSetting } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../hooks/omnichannel/useQueuedInquiries';
import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

const order = [
	'Incoming_Calls',
	'Incoming_Livechats',
	'Open_Livechats',
	'On_Hold_Chats',
	'Unread',
	'Favorites',
	'Teams',
	'Discussions',
	'Channels',
	'Direct_Messages',
	'Conversations',
] as const;

type useRoomListReturnType = {
	roomList: Array<SubscriptionWithRoom>;
	groupsCount: number[];
	groupsList: TranslationKey[];
	groupedUnreadInfo: Pick<
		SubscriptionWithRoom,
		'userMentions' | 'groupMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'tunreadGroup' | 'alert' | 'hideUnreadStatus'
	>[];
};
export const useRoomList = ({ collapsedGroups }: { collapsedGroups?: string[] }): useRoomListReturnType => {
	const showOmnichannel = useOmnichannelEnabled();
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const sidebarOrder = useUserPreference<typeof order>('sidebarSectionsOrder') ?? order;
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	const incomingCalls = useVideoConfIncomingCalls();

	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	const { groupsCount, groupsList, roomList, groupedUnreadInfo } = useDebouncedValue(
		useMemo(() => {
			const isCollapsed = (groupTitle: string) => collapsedGroups?.includes(groupTitle);

			const incomingCall = new Set();
			const favorite = new Set();
			const team = new Set();
			const omnichannel = new Set();
			const unread = new Set();
			const channels = new Set();
			const direct = new Set();
			const discussion = new Set();
			const conversation = new Set();
			const onHold = new Set();

			rooms.forEach((room) => {
				if (room.archived) {
					return;
				}

				if (incomingCalls.find((call) => call.rid === room.rid)) {
					return incomingCall.add(room);
				}

				if (sidebarShowUnread && (room.alert || room.unread || room.tunread?.length) && !room.hideUnreadStatus) {
					return unread.add(room);
				}

				if (favoritesEnabled && room.f) {
					return favorite.add(room);
				}

				if (sidebarGroupByType && room.teamMain) {
					return team.add(room);
				}

				if (sidebarGroupByType && isDiscussionEnabled && room.prid) {
					return discussion.add(room);
				}

				if (room.t === 'c' || room.t === 'p') {
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
			incomingCall.size && groups.set('Incoming_Calls', incomingCall);

			showOmnichannel && inquiries.enabled && queue.length && groups.set('Incoming_Livechats', new Set(queue));
			showOmnichannel && omnichannel.size && groups.set('Open_Livechats', omnichannel);
			showOmnichannel && onHold.size && groups.set('On_Hold_Chats', onHold);

			sidebarShowUnread && unread.size && groups.set('Unread', unread);

			favoritesEnabled && favorite.size && groups.set('Favorites', favorite);

			sidebarGroupByType && team.size && groups.set('Teams', team);

			sidebarGroupByType && isDiscussionEnabled && discussion.size && groups.set('Discussions', discussion);

			sidebarGroupByType && channels.size && groups.set('Channels', channels);

			sidebarGroupByType && direct.size && groups.set('Direct_Messages', direct);

			!sidebarGroupByType && groups.set('Conversations', conversation);

			const { groupsCount, groupsList, roomList, groupedUnreadInfo } = sidebarOrder.reduce(
				(acc, key) => {
					const value = groups.get(key);

					if (!value) {
						return acc;
					}

					acc.groupsList.push(key as TranslationKey);

					const groupedUnreadInfoAcc = {
						userMentions: 0,
						groupMentions: 0,
						tunread: [],
						tunreadUser: [],
						unread: 0,
					};

					if (isCollapsed(key)) {
						const groupedUnreadInfo = [...value].reduce(
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
				} as useRoomListReturnType,
			);

			return { groupsCount, groupsList, roomList, groupedUnreadInfo };
		}, [
			rooms,
			showOmnichannel,
			inquiries.enabled,
			queue,
			sidebarShowUnread,
			favoritesEnabled,
			sidebarGroupByType,
			isDiscussionEnabled,
			sidebarOrder,
			collapsedGroups,
			incomingCalls,
		]),
		50,
	);

	return {
		roomList,
		groupsCount,
		groupsList,
		groupedUnreadInfo,
	};
};
