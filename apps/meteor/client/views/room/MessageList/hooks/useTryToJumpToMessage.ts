import { isThreadMainMessage, isThreadMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useEffect } from 'react';
import type { WindowVirtualizerHandle } from 'virtua';

import { RoomHistoryManager } from '../../../../lib/RoomHistoryManager';
import { messagesQueryKeys } from '../../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';
import { setMessageJumpQueryStringParameter } from '../../../../lib/utils/setMessageJumpQueryStringParameter';
import { useRoomMessages } from '../../contexts/RoomContext';
import { useGoToRoom } from '../../hooks/useGoToRoom';
import { clearHighlightMessage, setHighlightMessage } from '../providers/messageHighlightSubscription';

type UseTryToJumpToMessageProps = {
	rid: string;
	virtualizerRef: MutableRefObject<WindowVirtualizerHandle | null>;
	setIsJumpingToMessage: Dispatch<SetStateAction<boolean>>;
	messages: { _id: string }[];
};

const useTryToJumpToMessage = ({ rid, virtualizerRef, setIsJumpingToMessage, messages }: UseTryToJumpToMessageProps) => {
	const messageJumpParam = useSearchParameter('msg');

	const { isLoadingMoreMessages } = useRoomMessages();

	const getMessage = useEndpoint('GET', '/v1/chat.getMessage');

	const goToRoom = useGoToRoom();

	const { data: message, isError } = useQuery({
		queryKey: messageJumpParam ? messagesQueryKeys.message(messageJumpParam) : [],
		queryFn: async () => {
			if (!messageJumpParam) return null;
			const { message } = await getMessage({ msgId: messageJumpParam });
			return mapMessageFromApi(message);
		},
		enabled: !!messageJumpParam,
	});

	const isThreadReply = !!message && isThreadMessage(message) && !isThreadMainMessage(message) && message.tshow !== true;
	const targetId = isThreadReply ? message.tmid : messageJumpParam;

	useEffect(() => {
		if (!targetId || !message) {
			return;
		}

		setIsJumpingToMessage(true);

		if (message.rid !== rid) {
			return;
		}

		void RoomHistoryManager.getSurroundingChannelMessages({ _id: targetId, rid })
			.catch(() => undefined)
			.finally(() => setIsJumpingToMessage(false));
	}, [targetId, rid, message, setIsJumpingToMessage]);

	useEffect(() => {
		if (!messageJumpParam) {
			setIsJumpingToMessage(false);
			return;
		}
		if (isError) {
			setIsJumpingToMessage(false);
			setMessageJumpQueryStringParameter(null);
			return;
		}
		if (!message) {
			return;
		}
		if (!isThreadMessage(message) && !isThreadMainMessage(message) && message.rid !== rid) {
			setIsJumpingToMessage(false);
			goToRoom(message.rid);
			return;
		}
		if (!virtualizerRef.current) {
			return;
		}

		if (isLoadingMoreMessages || messages.length === 0) {
			return;
		}

		const targetIndex = targetId ? messages.findIndex((current) => current._id === targetId) : -1;

		if (!targetId || targetIndex < 0) {
			return;
		}

		// TODO: Calculate the offset of the page, for the message to be in the center of the page
		virtualizerRef.current?.scrollToIndex(targetIndex, {
			align: 'center',
		});

		setHighlightMessage(targetId);

		setTimeout(() => {
			clearHighlightMessage();
		}, 2000);

		setTimeout(() => {
			setIsJumpingToMessage(false);
			if (targetId === messageJumpParam) {
				setMessageJumpQueryStringParameter(null);
			}
		}, 500);
	}, [messageJumpParam, virtualizerRef, setIsJumpingToMessage, rid, messages, message, isError, isLoadingMoreMessages, targetId, goToRoom]);
};

export default useTryToJumpToMessage;
