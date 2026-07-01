import { isThreadMainMessage, isThreadMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useEffect } from 'react';
import type { WindowVirtualizerHandle } from 'virtua';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { messagesQueryKeys } from '../../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';
import { setMessageJumpQueryStringParameter } from '../../../../lib/utils/setMessageJumpQueryStringParameter';
import { useRoomMessages } from '../../contexts/RoomContext';
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

	const { data: message } = useQuery({
		queryKey: messageJumpParam ? messagesQueryKeys.message(messageJumpParam) : [],
		queryFn: async () => {
			if (!messageJumpParam) return null;
			const { message } = await getMessage({ msgId: messageJumpParam });
			return mapMessageFromApi(message);
		},
		enabled: !!messageJumpParam,
	});

	useEffect(() => {
		if (!messageJumpParam) {
			setIsJumpingToMessage(false);
			return;
		}
		if (!message) {
			return;
		}
		// Thread deep links are handled by useTryToJumpToThreadMessage; do not use the main list virtualizer
		// If tshow is true, there is a preview on the main list, in this case we scroll to it
		if (message && isThreadMessage(message) && !isThreadMainMessage(message) && message.tshow !== true) {
			setIsJumpingToMessage(false);
			return;
		}
		if (!virtualizerRef.current) {
			return;
		}
		setIsJumpingToMessage(true);

		if (isLoadingMoreMessages || messages.length === 0) {
			return;
		}
		const loadedMessage = messages.find((message) => message._id === messageJumpParam);
		if (!loadedMessage) {
			// Do not load surrounding messages for thread messages that have a tshow: true
			// as these are previews on the main list and will be handled by useTryToJumpToThreadMessage
			if (message && (!isThreadMessage(message) || isThreadMainMessage(message))) {
				RoomHistoryManager.getSurroundingChannelMessages(message);
			}
			return;
		}
		const messageIndex = messages.indexOf(loadedMessage);

		// TODO: Calculate the offset of the page, for the message to be in the center of the page
		virtualizerRef.current?.scrollToIndex(messageIndex, {
			align: 'center',
		});

		setHighlightMessage(loadedMessage._id);

		setTimeout(() => {
			clearHighlightMessage();
		}, 2000);

		setTimeout(() => {
			setIsJumpingToMessage(false);
			setMessageJumpQueryStringParameter(null);
		}, 500);
	}, [messageJumpParam, virtualizerRef, setIsJumpingToMessage, rid, messages, message, isLoadingMoreMessages]);
};

export default useTryToJumpToMessage;
