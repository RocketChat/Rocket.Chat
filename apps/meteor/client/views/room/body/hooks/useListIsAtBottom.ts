import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { MutableRefObject } from 'react';
import { useCallback, useRef } from 'react';

import { isAtBottom as isAtBottomLib } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { useSafeRefCallback } from '../../../../hooks/useSafeRefCallback';

export const useListIsAtBottom = () => {
	const atBottomRef = useRef(true);

	const jumpToRef = useRef<HTMLElement>(undefined);

	const innerBoxRef = useRef<HTMLDivElement | null>(null);

	const sendToBottom = useCallback(() => {
		innerBoxRef.current?.scrollTo({ left: 30, top: innerBoxRef.current?.scrollHeight });
	}, []);

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
			(node: HTMLElement | null) => {
				if (!node) {
					return;
				}

				const messageList = node.querySelector('ul');

				if (!messageList) {
					return;
				}

				const observer = new ResizeObserver(() => {
					if (jumpToRef.current) {
						atBottomRef.current = false;
					}
					if (atBottomRef.current === true) {
						node.scrollTo({ left: 30, top: node.scrollHeight });
					}
				});

				observer.observe(messageList);

				const handleScroll = withThrottling({ wait: 100 })(() => {
					atBottomRef.current = isAtBottom(100);
				});

				node.addEventListener('scroll', handleScroll, {
					passive: true,
				});

				return () => {
					observer.disconnect();
					node.removeEventListener('scroll', handleScroll);
				};
			},
			[isAtBottom],
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
