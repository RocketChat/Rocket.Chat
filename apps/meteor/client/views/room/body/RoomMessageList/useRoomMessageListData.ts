import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import type { MessageListPosition } from '@rocket.chat/ui-message-list';
import { useCallback, useMemo, useState } from 'react';

import { useMessages } from './useMessages';
import { useRoomJumpTarget } from './useRoomJumpTarget';
import { RoomHistoryManager, useRoomHistoryState } from '../../../../lib/RoomHistoryManager';
import { RoomManager } from '../../../../lib/RoomManager';
import { useRoomSubscription } from '../../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../../hooks/useFirstUnreadMessageId';
import { useRoomMessages } from '../../hooks/useRoomMessages';

type LoadingDirection = 'older' | 'newer' | undefined;

// The room has always ignored the replies of a thread that arrive, even those that show in it: they neither move the list nor call for it
const isNotThreadReply = (message: IMessage) => !message.tmid;

/**
 * The room's loaded messages and what the message list needs to page through them, jump in them and come back to where the
 * viewer left them: the room's history manager, the `msg` search parameter, the room store and its read state.
 */
export const useRoomMessageListData = (rid: IRoom['_id']) => {
	const uid = useUserId();
	const subscription = useRoomSubscription();
	const messages = useMessages({ rid });
	const { hasMorePreviousMessages, hasMoreNextMessages, isLoadingMoreMessages } = useRoomMessages();
	const isLoadingInitialMessages = useRoomHistoryState(rid, (state) => state.isLoading && state.loaded === undefined);
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const groupingPeriodSeconds = useSetting('Message_GroupingPeriod', 300);
	const { targetMessageId, onTargetMessageReached } = useRoomJumpTarget(rid, messages);

	const [loadingDirection, setLoadingDirection] = useState<LoadingDirection>();
	// A page the room asked for in the same moment, such as the retry of a first page that failed, is the one load running
	const load = useCallback(
		async (direction: LoadingDirection, loadPage: () => Promise<void>) => {
			if (RoomHistoryManager.isLoading(rid)) {
				return;
			}
			setLoadingDirection(direction);
			try {
				await loadPage();
			} finally {
				setLoadingDirection(undefined);
			}
		},
		[rid],
	);

	const onLoadOlderMessages = useCallback(() => load('older', () => RoomHistoryManager.getMore(rid)), [load, rid]);
	const onLoadNewerMessages = useCallback(() => load('newer', () => RoomHistoryManager.getMoreNext(rid)), [load, rid]);
	// The window is cleared before the first page loads, so the list is not left waiting for a latest page that may fail to come
	const onJumpToLatest = useCallback(async () => {
		RoomHistoryManager.clear(rid);
		await RoomHistoryManager.getMoreIfIsEmpty(rid);
	}, [rid]);

	// The first unread id may only be known once the room's history loads, so the messages already listed are checked too. A thread
	// reply that does not show in the room does not count, and neither does the viewer's own message.
	const lastSeen = subscription?.ls?.getTime();
	const hasUnseenMessages = useMemo(() => {
		if (lastSeen === undefined) {
			return false;
		}
		for (let i = messages.length - 1; i >= 0 && messages[i].ts.getTime() > lastSeen; i--) {
			const message = messages[i];
			if (message.u._id !== uid && (!message.tmid || message.tshow)) {
				return true;
			}
		}
		return false;
	}, [messages, lastSeen, uid]);

	const hasUnreadMessages = Boolean(firstUnreadMessageId || hasUnseenMessages);
	const restoredPosition = hasUnreadMessages ? undefined : RoomManager.getStore(rid)?.position;
	const onPositionChange = useCallback((position: MessageListPosition) => RoomManager.getStore(rid)?.savePosition(position), [rid]);

	const isOwnMessage = useCallback((message: IMessage) => message.u._id === uid && !message.tmid, [uid]);

	return {
		messages,
		hasOlderMessages: hasMorePreviousMessages,
		hasNewerMessages: hasMoreNextMessages,
		isLoadingInitialMessages,
		isLoadingOlderMessages: isLoadingMoreMessages && loadingDirection !== 'newer',
		isLoadingNewerMessages: isLoadingMoreMessages && loadingDirection === 'newer',
		onLoadOlderMessages,
		onLoadNewerMessages,
		onJumpToLatest,
		firstUnreadMessageId,
		targetMessageId,
		onTargetMessageReached,
		isOwnMessage,
		countsAsArrival: isNotThreadReply,
		groupingPeriodSeconds,
		restoredPosition,
		onPositionChange,
	};
};
