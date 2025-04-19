import type { IMessage } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useMessageListJumpToMessageParam, useMessageListRef } from '../../../../components/message/list/MessageListContext';
import { useSafeRefCallback } from '../../../../hooks/useSafeRefCallback';
import { setHighlightMessage, clearHighlightMessage } from '../providers/messageHighlightSubscription';

// this is an arbitrary value so that there's a gap between the header and the message;

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

				if (listRef) {
					listRef.current = node;
				}

				node.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				});
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
						listRef.current = undefined;
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
