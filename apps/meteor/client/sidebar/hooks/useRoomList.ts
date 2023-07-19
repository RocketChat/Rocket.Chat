import { type ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useVideoConfIncomingCalls } from '../../contexts/VideoConfContext';
import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../hooks/omnichannel/useQueuedInquiries';

const emptyQueue: ILivechatInquiryRecord[] = [];

export const useRoomList = <T extends SubscriptionWithRoom>(list: T[]): T[] => {
	const roomList = useDebouncedValue<T[]>(list, 50);

	const showOmnichannel = useOmnichannelEnabled();
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const inquiries = useQueuedInquiries();

	const incomingCalls = useVideoConfIncomingCalls();

	let queue = emptyQueue;
	if (inquiries.enabled) {
		queue = inquiries.queue;
	}

	return useMemo(() => {
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

		roomList.forEach((room) => {
			if (room.archived) {
				return;
			}

			if (incomingCalls.find((call) => call.rid === room.rid)) {
				return incomingCall.add(room);
			}

			if (sidebarShowUnread && (room.alert || room.unread) && !room.hideUnreadStatus) {
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

		const groups = new Map();
		showOmnichannel && groups.set('Omnichannel', []);
		incomingCall.size && groups.set('Incoming Calls', incomingCall);
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
		return [...groups.entries()].flatMap(([key, group]) => [key, ...group]);
	}, [
		roomList,
		showOmnichannel,
		inquiries.enabled,
		queue,
		sidebarShowUnread,
		favoritesEnabled,
		sidebarGroupByType,
		isDiscussionEnabled,
		incomingCalls,
	]);
};
