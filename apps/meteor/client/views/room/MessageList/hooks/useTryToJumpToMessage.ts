import { isThreadMainMessage, isThreadMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useRouter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useEffect } from 'react';
import type { WindowVirtualizerHandle } from 'virtua';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { messagesQueryKeys } from '../../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';
import { setMessageJumpQueryStringParameter } from '../../../../lib/utils/setMessageJumpQueryStringParameter';
import { clearHighlightMessage, setHighlightMessage } from '../providers/messageHighlightSubscription';

type UseTryToJumpToMessageProps = {
	rid: string;
	virtualizerRef: MutableRefObject<WindowVirtualizerHandle | null>;
	isJumpingToMessage: MutableRefObject<boolean>;
	messages: { _id: string }[];
};

const useTryToJumpToMessage = ({ rid, virtualizerRef, isJumpingToMessage, messages }: UseTryToJumpToMessageProps) => {
	const messageJumpParam = useSearchParameter('msg');
	const router = useRouter();

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

	// REVIEW TODO: Check if we can use the onScroll event to do this
	// Context: jump to message only works in the scroll event if the message is not loaded yet
	// If the message is loaded, the scrollelement does not resize, not triggering the scroll event

	useEffect(() => {
		if (!messageJumpParam) {
			return;
		}
		// Thread deep links are handled by useTryToJumpToThreadMessage; do not use the main list virtualizer
		if (message && (isThreadMessage(message) || isThreadMainMessage(message))) {
			isJumpingToMessage.current = false;
			return;
		}

		if (!virtualizerRef.current) {
			return;
		}

		isJumpingToMessage.current = true;

		if (RoomHistoryManager.isLoading(rid)) {
			return;
		}

		const loadedMessage = messages.find((message) => message._id === messageJumpParam);

		if (!loadedMessage) {
			if (message) {
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

		// REVIEW TODO: Find how to avoid a race condition with the jump to message and jump to bottom
		setTimeout(() => {
			isJumpingToMessage.current = false;
		}, 500);

		setMessageJumpQueryStringParameter(null);
	}, [messageJumpParam, virtualizerRef, isJumpingToMessage, rid, messages, router, message]);
};

export default useTryToJumpToMessage;
