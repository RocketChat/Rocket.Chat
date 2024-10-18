import type { ILivechatInquiryRecord, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useDebouncedValue, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey, SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserSubscriptions, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import { useVideoConfIncomingCalls } from '../../contexts/VideoConfContext';
import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../hooks/omnichannel/useQueuedInquiries';
import { useQueryOptions } from './useQueryOptions';

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

const CATEGORIES = {
	Incoming_Calls: 'Incoming_Calls',
	Incoming_Livechats: 'Incoming_Livechats',
	Open_Livechats: 'Open_Livechats',
	On_Hold_Chats: 'On_Hold_Chats',
	Unread: 'Unread',
	Favorites: 'Favorites',
	Teams: 'Teams',
	Discussions: 'Discussions',
	Channels: 'Channels',
	Direct_Messages: 'Direct_Messages',
	Conversations: 'Conversations',
};

const getGroupsCount = (rooms: Array<ISubscription & IRoom>) => {
	return rooms
		.reduce((acc, item, index) => {
			if (typeof item === 'string') {
				acc.push(index);
			}
			return acc;
		}, [] as number[])
		.map((item, index, arr) => (arr[index + 1] ? arr[index + 1] : rooms.length) - item - 1);
};

export const useRoomList = (): {
	flatList: Array<ISubscription & IRoom>;
	roomList: Array<ISubscription & IRoom>;
	groupsCount: number[];
	groupsList: TranslationKey[];
	handleCollapsedGroups: (groupTitle: string) => void;
	collapsedGroups: string[];
} => {
	const [collapsedGroups, setCollapsedGroups] = useLocalStorage<string[]>('sidebarGroups', []);

	const showOmnichannel = useOmnichannelEnabled();
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const sidebarOrder = useUserPreference<typeof order>('sidebarSectionsOrder') ?? order;
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const options = useQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	const incomingCalls = useVideoConfIncomingCalls();

	let queue = emptyQueue;
	if (inquiries.enabled) {
		queue = inquiries.queue;
	}

	const { flatRoomList, groupsCount, groupsList, roomList } = useDebouncedValue(
		useMemo(() => {
			const isCollapsed = (groupTitle: string) => collapsedGroups.includes(groupTitle);
			const shouldAddUnread = (room: SubscriptionWithRoom) =>
				!(sidebarShowUnread && isCollapsed(CATEGORIES.Unread) && (room.alert || room.unread));

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

				if (sidebarShowUnread && (room.alert || room.unread)) {
					return unread.add(room);
				}

				if (favoritesEnabled && room.f) {
					return shouldAddUnread(room) && favorite.add(room);
				}

				if (sidebarGroupByType && room.teamMain) {
					return shouldAddUnread(room) && team.add(room);
				}

				if (sidebarGroupByType && isDiscussionEnabled && room.prid) {
					return shouldAddUnread(room) && discussion.add(room);
				}

				if (room.t === 'c' || room.t === 'p') {
					shouldAddUnread(room) && channels.add(room);
				}

				if (room.t === 'l' && room.onHold) {
					return showOmnichannel && shouldAddUnread(room) && onHold.add(room);
				}

				if (room.t === 'l') {
					return showOmnichannel && shouldAddUnread(room) && omnichannel.add(room);
				}

				if (room.t === 'd') {
					shouldAddUnread(room) && direct.add(room);
				}

				if (shouldAddUnread(room)) {
					conversation.add(room);
				}
			});

			const groups = new Map();
			incomingCall.size && groups.set('Incoming_Calls', incomingCall);

			showOmnichannel && inquiries.enabled && queue.length && groups.set('Incoming_Livechats', queue);
			showOmnichannel && omnichannel.size && groups.set('Open_Livechats', omnichannel);
			showOmnichannel && onHold.size && groups.set('On_Hold_Chats', onHold);

			sidebarShowUnread && unread.size && groups.set('Unread', unread);

			favoritesEnabled && favorite.size && groups.set('Favorites', favorite);

			sidebarGroupByType && team.size && groups.set('Teams', team);

			sidebarGroupByType && isDiscussionEnabled && discussion.size && groups.set('Discussions', discussion);

			sidebarGroupByType && channels.size && groups.set('Channels', channels);

			sidebarGroupByType && direct.size && groups.set('Direct_Messages', direct);

			!sidebarGroupByType && groups.set('Conversations', conversation);

			const groupsList: TranslationKey[] = [];
			const roomList: Array<ISubscription & IRoom> = [];

			const flatRoomList = sidebarOrder
				.map((key) => {
					const group = groups.get(key);
					if (!group) {
						return [];
					}
					groupsList.push(key);
					if (isCollapsed(key)) {
						return [key];
					}

					roomList.push(...group);

					return [key, ...group];
				})
				.flat();

			return { flatRoomList, groupsCount: getGroupsCount([...flatRoomList]), groupsList, roomList };
		}, [
			rooms,
			showOmnichannel,
			incomingCalls,
			inquiries.enabled,
			queue,
			sidebarShowUnread,
			favoritesEnabled,
			sidebarGroupByType,
			isDiscussionEnabled,
			sidebarOrder,
			collapsedGroups,
		]),
		50,
	);

	const handleCollapsedGroups = useCallback(
		(group: string) => {
			if (collapsedGroups.includes(group)) {
				setCollapsedGroups(collapsedGroups.filter((item) => item !== group));
			} else {
				setCollapsedGroups([...collapsedGroups, group]);
			}
		},
		[collapsedGroups, setCollapsedGroups],
	);

	return {
		flatList: flatRoomList,
		roomList,
		groupsCount,
		groupsList,
		handleCollapsedGroups,
		collapsedGroups,
	};
};
