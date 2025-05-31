import type { IMessage } from '@rocket.chat/core-typings';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback, useRef } from 'react';

import { useMessageListJumpToMessageParam, useMessageListRef } from '../../../../components/message/list/MessageListContext';
import { setRef } from '../../composer/hooks/useMessageComposerMergedRefs';
import { setHighlightMessage, clearHighlightMessage } from '../providers/messageHighlightSubscription';

/**
 * That is completely messy, CustomScrollbars force us to initialize the scrollbars inside an effect
 * all refCallbacks happen before the effect, more than that, the scrollbars also reset the scroll position
 * so we need to check if the scrollbars are initialized and if there is any message to be highlighted
 */

export const useJumpToMessageImperative = () => {
	const jumpToRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const jumpToRefAction = useCallback(() => {
		if (!jumpToRef.current || !containerRef.current) {
			return;
		}

		// calculate the scroll position to center the message
		// avoiding scrollIntoView because it will can scroll parent elements
		containerRef.current.scrollTop =
			jumpToRef.current.offsetTop - containerRef.current.clientHeight / 2 + jumpToRef.current.offsetHeight / 2;
	}, []);

	return {
		jumpToRef: useMergedRefs(jumpToRef, jumpToRefAction),
		innerRef: useMergedRefs(containerRef, jumpToRefAction),
	};
};

/**
 * `listRef` is a reference to the message node in the message list.
 * its shared between other hooks like `useLoadSurroundingMessages`, `useJumpToMessage`, `useGetMore`, `useListIsAtBottom` and `useRestoreScrollPosition`
 * since each hook has a different concern, this ref helps each other aware if a message is being highlighted which changes the scroll position

 */

export const useJumpToMessage = (messageId: IMessage['_id']) => {
	const jumpToMessageParam = useMessageListJumpToMessageParam();
	const listRef = useMessageListRef();
	const router = useRouter();

	const ref = useSafeRefCallback(
		useCallback(
			(node: HTMLElement | null) => {
				if (!node || !scroll) {
					return;
				}

				if (!listRef) {
					return;
				}

				setRef(listRef, node);

				const handleScroll = () => {
					const { msg: _, ...search } = router.getSearchParameters();
					router.navigate(
						{
							pathname: router.getLocationPathname(),
							search,
						},
						{ replace: true },
					);
					setTimeout(clearHighlightMessage, 2000);
				};

				const observer = new IntersectionObserver(
					(entries) => {
						entries.forEach((entry) => {
							if (entry.isIntersecting) {
								handleScroll();
							}
						});
					},
					{
						threshold: 0.1,
					},
				);

				observer.observe(node);

				setHighlightMessage(messageId);

				return () => {
					observer.disconnect();
					if (listRef) {
						setRef(listRef, undefined);
					}
				};
			},
			[listRef, messageId, router],
		),
	);

	if (jumpToMessageParam !== messageId) {
		return undefined;
	}

	return ref;
};
