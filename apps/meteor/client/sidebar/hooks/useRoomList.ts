import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserSubscriptions, useSetting } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../views/omnichannel/hooks/useQueuedInquiries';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

const order = [
	'Incoming_Calls',
	'Incoming_Livechats',
	'Open_Livechats',
	'On_Hold_Chats',
	'Unread',
	'Drafts',
	'Favorites',
	'Teams',
	'Discussions',
	'Channels',
	'Teams_and_channels',
	'Direct_Messages',
	'Conversations',
] as const;

// Type groups that hold regular conversations and can be routed into "Conversations"
// when they are not part of the visible sidebar sections. Override buckets (Unread,
// Drafts, Favorites) and system groups (omnichannel, incoming calls) are excluded.
const routableGroups: string[] = ['Teams', 'Discussions', 'Channels', 'Teams_and_channels', 'Direct_Messages'];

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
	const sidebarGroupTeamsAndChannels = useUserPreference('sidebarGroupTeamsAndChannels');
	const groupUnlistedInConversations = useUserPreference('sidebarGroupUnlistedInConversations');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const sidebarDrafts = useFeaturePreview('sidebarDrafts');
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

			const drafts = new Set();
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

				if (sidebarDrafts && room.draft) {
					return drafts.add(room);
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

			sidebarDrafts && drafts.size && groups.set('Drafts', drafts);

			favoritesEnabled && favorite.size && groups.set('Favorites', favorite);

			const mergeTeamsAndChannels = sidebarGroupByType && sidebarGroupTeamsAndChannels;

			sidebarGroupByType && !mergeTeamsAndChannels && team.size && groups.set('Teams', team);

			sidebarGroupByType && isDiscussionEnabled && discussion.size && groups.set('Discussions', discussion);

			sidebarGroupByType && !mergeTeamsAndChannels && channels.size && groups.set('Channels', channels);

			if (mergeTeamsAndChannels) {
				const teamsAndChannels = new Set([...team, ...channels]);
				teamsAndChannels.size && groups.set('Teams_and_channels', teamsAndChannels);
			}

			sidebarGroupByType && direct.size && groups.set('Direct_Messages', direct);

			!sidebarGroupByType && groups.set('Conversations', conversation);

			// Users with a `sidebarSectionsOrder` saved before this group existed won't have the
			// 'Teams_and_channels' key, so the merged group would never render. Inject it after 'Channels'.
			// Build the render order. Users with a `sidebarSectionsOrder` saved before the
			// 'Teams_and_channels' group existed won't have the key, so inject it after 'Channels'.
			const effectiveOrder: string[] = [...sidebarOrder];
			if (!effectiveOrder.includes('Teams_and_channels')) {
				const channelsIndex = effectiveOrder.indexOf('Channels');
				effectiveOrder.splice(channelsIndex === -1 ? effectiveOrder.length : channelsIndex + 1, 0, 'Teams_and_channels');
			}

			// When enabled, rooms belonging to a routable group that is not part of the visible
			// sections would otherwise vanish from the sidebar. Route them into "Conversations"
			// instead of dropping them.
			if (sidebarGroupByType && groupUnlistedInConversations) {
				const unlisted = new Set<SubscriptionWithRoom>();
				for (const [key, set] of groups) {
					if (!routableGroups.includes(key) || effectiveOrder.includes(key)) {
						continue;
					}
					set.forEach((room) => unlisted.add(room as SubscriptionWithRoom));
					groups.delete(key);
				}

				if (unlisted.size) {
					const existing = groups.get('Conversations');
					groups.set('Conversations', existing ? new Set([...existing, ...unlisted]) : unlisted);
					if (!effectiveOrder.includes('Conversations')) {
						effectiveOrder.push('Conversations');
					}
				}
			}

			const { groupsCount, groupsList, roomList, groupedUnreadInfo } = effectiveOrder.reduce(
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
			sidebarDrafts,
			queue,
			sidebarShowUnread,
			favoritesEnabled,
			sidebarGroupByType,
			sidebarGroupTeamsAndChannels,
			groupUnlistedInConversations,
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
