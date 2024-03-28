import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useCallback, useRef } from 'react';

import { isAtBottom as isAtBottomLib } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useListIsAtBottom = () => {
	const atBottomRef = useRef(true);

	const innerBoxRef = useRef<HTMLDivElement | null>(null);

	const sendToBottom = useCallback(() => {
		innerBoxRef.current?.scrollTo({ left: 30, top: innerBoxRef.current?.scrollHeight });
	}, []);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			sendToBottom();
		}
	}, [atBottomRef, sendToBottom]);

	const isAtBottom = useCallback((threshold = 0) => {
		if (!innerBoxRef.current) {
			return true;
		}
		return isAtBottomLib(innerBoxRef.current, threshold);
	}, []);

	const ref = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const messageList = node.querySelector('ul');

			if (!messageList) {
				return;
			}

			const observer = new ResizeObserver(() => {
				if (atBottomRef.current === true) {
					node.scrollTo({ left: 30, top: node.scrollHeight });
				}
			});

			observer.observe(messageList);

			node.addEventListener(
				'scroll',
				withThrottling({ wait: 100 })(() => {
					atBottomRef.current = isAtBottom(100);
				}),
				{
					passive: true,
				},
			);
		},
		[isAtBottom],
	);

	return {
		atBottomRef,
		innerRef: useMergedRefs(ref, innerBoxRef) as unknown as React.MutableRefObject<HTMLDivElement | null>,
		sendToBottom,
		sendToBottomIfNecessary,
		isAtBottom,
	};
};
