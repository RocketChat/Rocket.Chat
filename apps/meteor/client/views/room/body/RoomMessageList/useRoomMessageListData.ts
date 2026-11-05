import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import type { MessageListPosition } from '@rocket.chat/ui-message-list';
import { useCallback, useState } from 'react';

import { useMessages } from './useMessages';
import { useRoomJumpTarget } from './useRoomJumpTarget';
import { RoomHistoryManager, useRoomHistoryState } from '../../../../lib/RoomHistoryManager';
import { RoomManager } from '../../../../lib/RoomManager';
import { useRoomMessages } from '../../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../../hooks/useFirstUnreadMessageId';

type LoadingDirection = 'older' | 'newer' | undefined;

/**
 * The room's loaded messages and what the message list needs to page through them, jump in them and come back to where the
 * viewer left them: the room's history manager, the `msg` search parameter, the room store and its read state.
 */
export const useRoomMessageListData = (rid: IRoom['_id']) => {
	const uid = useUserId();
	const messages = useMessages({ rid });
	const { hasMorePreviousMessages, hasMoreNextMessages, isLoadingMoreMessages } = useRoomMessages();
	const isLoadingInitialMessages = useRoomHistoryState(rid, (state) => state.isLoading && state.loaded === undefined);
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const groupingPeriodSeconds = useSetting('Message_GroupingPeriod', 300);
	const { targetMessageId, onTargetMessageReached } = useRoomJumpTarget(rid, messages);

	const [loadingDirection, setLoadingDirection] = useState<LoadingDirection>();
	const load = useCallback(async (direction: LoadingDirection, loadPage: () => Promise<void>) => {
		setLoadingDirection(direction);
		try {
			await loadPage();
		} finally {
			setLoadingDirection(undefined);
		}
	}, []);

	const onLoadOlderMessages = useCallback(() => load('older', () => RoomHistoryManager.getMore(rid)), [load, rid]);
	const onLoadNewerMessages = useCallback(() => load('newer', () => RoomHistoryManager.getMoreNext(rid)), [load, rid]);
	const onJumpToLatest = useCallback(async () => {
		RoomHistoryManager.clear(rid);
		await RoomHistoryManager.getMoreIfIsEmpty(rid);
	}, [rid]);

	const [restoredPosition] = useState(() => (firstUnreadMessageId ? undefined : RoomManager.getStore(rid)?.position));
	const onPositionChange = useCallback((position: MessageListPosition) => RoomManager.getStore(rid)?.savePosition(position), [rid]);

	const isOwnMessage = useCallback((message: IMessage) => message.u._id === uid, [uid]);

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
		groupingPeriodSeconds,
		restoredPosition,
		onPositionChange,
	};
};
