import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isThreadMainMessage, isThreadMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { RoomHistoryManager, useRoomHistoryState } from '../../../../lib/RoomHistoryManager';
import { messagesQueryKeys } from '../../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';
import { setMessageJumpQueryStringParameter } from '../../../../lib/utils/setMessageJumpQueryStringParameter';
import { useGoToRoom } from '../../hooks/useGoToRoom';

/**
 * The message the room list jumps to, from the `msg` search parameter. A message of another room opens that room; a thread
 * reply that is not shown in the room jumps to its thread's main message. The messages around the target are loaded, starting
 * at once when the room has none, so the room does not wait for the message to learn where it is.
 */
export const useRoomJumpTarget = (rid: IRoom['_id'], messages: readonly IMessage[]) => {
	const messageJumpParam = useSearchParameter('msg');
	const getMessage = useEndpoint('GET', '/v1/chat.getMessage');
	const goToRoom = useGoToRoom();
	const isLoadingHistory = useRoomHistoryState(rid, (state) => state.isLoading);

	const { data: message, isError } = useQuery({
		queryKey: messagesQueryKeys.message(messageJumpParam ?? ''),
		queryFn: async () => mapMessageFromApi((await getMessage({ msgId: messageJumpParam ?? '' })).message),
		enabled: !!messageJumpParam,
	});

	const isThreadReply = !!message && isThreadMessage(message) && !isThreadMainMessage(message) && message.tshow !== true;
	const isInThisRoom = message?.rid === rid;
	const fetchedMessage = messageJumpParam && message?._id === messageJumpParam && isInThisRoom ? message : undefined;
	const targetMessageId = isThreadReply ? fetchedMessage?.tmid : fetchedMessage?._id;

	useEffect(() => {
		if (messageJumpParam && isError) {
			void setMessageJumpQueryStringParameter(null);
		}
	}, [messageJumpParam, isError]);

	useEffect(() => {
		if (!message || message._id !== messageJumpParam || isInThisRoom || isThreadMessage(message) || isThreadMainMessage(message)) {
			return;
		}
		void goToRoom(message.rid);
	}, [message, messageJumpParam, isInThisRoom, goToRoom]);

	useEffect(() => {
		if (!messageJumpParam || RoomHistoryManager.isLoaded(rid) || RoomHistoryManager.isLoading(rid)) {
			return;
		}
		void RoomHistoryManager.getSurroundingMessages({ _id: messageJumpParam, rid }).catch(() => undefined);
	}, [messageJumpParam, rid]);

	const requestedTargetRef = useRef<string | undefined>(undefined);
	const isTargetLoaded = !!targetMessageId && messages.some(({ _id }) => _id === targetMessageId);

	useEffect(() => {
		if (!targetMessageId || isTargetLoaded || isLoadingHistory || requestedTargetRef.current === targetMessageId) {
			return;
		}
		requestedTargetRef.current = targetMessageId;
		void RoomHistoryManager.getSurroundingChannelMessages({ _id: targetMessageId, rid }).catch(() => undefined);
	}, [targetMessageId, isTargetLoaded, isLoadingHistory, rid]);

	const onTargetMessageReached = useCallback(
		(messageId: IMessage['_id']) => {
			requestedTargetRef.current = undefined;
			if (messageId === messageJumpParam) {
				void setMessageJumpQueryStringParameter(null);
			}
		},
		[messageJumpParam],
	);

	return { targetMessageId, onTargetMessageReached };
};
