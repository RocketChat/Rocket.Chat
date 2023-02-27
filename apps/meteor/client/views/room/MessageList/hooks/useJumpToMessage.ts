import type { IMessage } from '@rocket.chat/core-typings';
import type { RefObject } from 'react';
import { useLayoutEffect } from 'react';

import { useMessageListJumpToMessageParam, useMessageListWrapperRef } from '../../../../components/message/list/MessageListContext';
import { setHighlightMessage, clearHighlightMessage } from '../providers/messageHighlightSubscription';

// this is an arbitrary value so that there's a gap between the header and the message;
const SCROLL_EXTRA_OFFSET = 60;

export const useJumpToMessage = (messageId: IMessage['_id'], messageRef: RefObject<HTMLDivElement>): void => {
	const jumpToMessageParam = useMessageListJumpToMessageParam();
	const containerRef = useMessageListWrapperRef();

	useLayoutEffect(() => {
		if (jumpToMessageParam !== messageId || !messageRef.current || !containerRef.current) {
			return;
		}

		const containerRect = containerRef.current.getBoundingClientRect();
		const messageRect = messageRef.current.getBoundingClientRect();

		const offset = messageRect.top - containerRect.top;
		const scrollPosition = containerRef.current.scrollTop;
		const newScrollPosition = scrollPosition + offset - SCROLL_EXTRA_OFFSET;

		// console.log({
		// 	containerRect,
		// 	messageRect,
		// 	scrollPosition,
		// 	newScrollPosition,
		// 	messageRef,
		// 	containerRef,
		// });

		containerRef.current.scrollTo({
			top: newScrollPosition,
			behavior: 'smooth',
		});

		setHighlightMessage(messageId);
		setTimeout(clearHighlightMessage, 1000);
	}, [messageId, jumpToMessageParam, messageRef, containerRef]);
};
