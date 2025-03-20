import type { IMessage } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useMessageListJumpToMessageParam, useMessageListRef } from '../../../../components/message/list/MessageListContext';
import { setHighlightMessage, clearHighlightMessage } from '../providers/messageHighlightSubscription';

// this is an arbitrary value so that there's a gap between the header and the message;
const SCROLL_EXTRA_OFFSET = 60;

export const useJumpToMessage = (messageId: IMessage['_id']) => {
	const jumpToMessageParam = useMessageListJumpToMessageParam();
	const listRef = useMessageListRef();
	const router = useRouter();

	const ref = useCallback(
		(node: HTMLElement | null) => {
			if (!node || !scroll) {
				return;
			}
			setTimeout(() => {
				if (listRef?.current) {
					const wrapper = listRef.current;
					const containerRect = wrapper.getBoundingClientRect();
					const messageRect = node.getBoundingClientRect();

					const offset = messageRect.top - containerRect.top;
					const scrollPosition = wrapper.scrollTop;
					const newScrollPosition = scrollPosition + offset - SCROLL_EXTRA_OFFSET;

					wrapper.scrollTo({ top: newScrollPosition, behavior: 'smooth' });
				}

				const { msg: _, ...search } = router.getSearchParameters();
				router.navigate(
					{
						pathname: router.getLocationPathname(),
						search,
					},
					{ replace: true },
				);

				setHighlightMessage(messageId);
				setTimeout(clearHighlightMessage, 2000);
			}, 500);
		},
		[listRef, messageId, router],
	);

	if (jumpToMessageParam !== messageId) {
		return undefined;
	}

	return ref;
};
