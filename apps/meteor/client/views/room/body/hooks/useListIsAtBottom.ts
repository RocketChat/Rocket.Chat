import { useMergedRefs, useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { MutableRefObject, RefObject } from 'react';
import { useCallback, useRef } from 'react';

import { isAtBottom as isAtBottomLib } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import type { VirtualizerHandle } from '../../../../../components/message/list/MessageListContext';

export const useListIsAtBottom = (virtualizerRef?: RefObject<VirtualizerHandle | null>) => {
	const atBottomRef = useRef(true);

	const jumpToRef = useRef<HTMLElement>(undefined);

	const innerBoxRef = useRef<HTMLDivElement | null>(null);

	const sendToBottom = useCallback(() => {
		if (virtualizerRef?.current) {
			virtualizerRef.current.scrollToEnd();
			return;
		}
		innerBoxRef.current?.scrollTo({ left: 30, top: innerBoxRef.current?.scrollHeight });
	}, [virtualizerRef]);

	const sendToBottomIfNecessary = useCallback(() => {
		if (jumpToRef.current) {
			atBottomRef.current = false;
		}
		if (atBottomRef.current === true) {
			sendToBottom();
		}
	}, [atBottomRef, sendToBottom]);

	const isAtBottom = useCallback<(threshold?: number) => boolean>((threshold = 0) => {
		if (!innerBoxRef.current) {
			return true;
		}
		return isAtBottomLib(innerBoxRef.current, threshold);
	}, []);

	const ref = useSafeRefCallback(
		useCallback(
			(node: HTMLElement) => {
				const messageList = node.querySelector('ul');

				if (!messageList) {
					return;
				}

				// const observer = new ResizeObserver(() => {
				// 	if (jumpToRef.current) {
				// 		atBottomRef.current = false;
				// 	}

				// 	if (atBottomRef.current === true) {
				// 		if (virtualizerRef?.current) {
				// 			virtualizerRef.current.scrollToEnd();
				// 		} else {
				// 			node.scrollTo({ left: 30, top: node.scrollHeight });
				// 		}
				// 	}
				// });

				// observer.observe(messageList);

				const handleScroll = withThrottling({ wait: 100 })(() => {
					atBottomRef.current = isAtBottom(100);
				});

				node.addEventListener('scroll', handleScroll, {
					passive: true,
				});

				return () => {
					// observer.disconnect();
					node.removeEventListener('scroll', handleScroll);
				};
			},
			[isAtBottom, virtualizerRef],
		),
	);

	return {
		atBottomRef,
		innerRef: useMergedRefs(ref, innerBoxRef) as unknown as MutableRefObject<HTMLDivElement | null>,
		sendToBottom,
		sendToBottomIfNecessary,
		isAtBottom,
		jumpToRef,
	};
};
