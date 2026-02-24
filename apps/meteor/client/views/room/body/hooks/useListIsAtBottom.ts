import { useMergedRefs, useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { MutableRefObject } from 'react';
import { useCallback, useRef, useState } from 'react';

import { isAtBottom as isAtBottomLib } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

const LONG_UP_DISTANCE_THRESHOLD = 400;

export const useListIsAtBottom = () => {
	const atBottomRef = useRef(true);

	const [isScrolledFarFromBottom, setIsScrolledFarFromBottom] = useState(false);

	const jumpToRef = useRef<HTMLElement>(undefined);

	const innerBoxRef = useRef<HTMLDivElement | null>(null);

	const sendToBottom = useCallback(() => {
		innerBoxRef.current?.scrollTo({ left: 30, top: innerBoxRef.current?.scrollHeight });
		setIsScrolledFarFromBottom(false);
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

	const updateScrolledFarState = useCallback(
		(node: HTMLElement) => {
			const distanceFromBottom = Math.max(0, node.scrollHeight - (node.scrollTop + node.clientHeight));
			const far = distanceFromBottom > LONG_UP_DISTANCE_THRESHOLD;
			setIsScrolledFarFromBottom((current) => (current === far ? current : far));
		},
		[],
	);

	const ref = useSafeRefCallback(
		useCallback(
			(node: HTMLElement) => {
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
						setIsScrolledFarFromBottom(false);
					} else {
						updateScrolledFarState(node);
					}
				});

				observer.observe(messageList);

				const handleScroll = withThrottling({ wait: 100 })(() => {
					atBottomRef.current = isAtBottom(100);
					if (atBottomRef.current === true) {
						setIsScrolledFarFromBottom(false);
						return;
					}

					updateScrolledFarState(node);
				});

				node.addEventListener('scroll', handleScroll, {
					passive: true,
				});

				return () => {
					observer.disconnect();
					node.removeEventListener('scroll', handleScroll);
				};
			},
			[isAtBottom, updateScrolledFarState],
		),
	);

	return {
		atBottomRef,
		innerRef: useMergedRefs(ref, innerBoxRef) as unknown as MutableRefObject<HTMLDivElement | null>,
		sendToBottom,
		sendToBottomIfNecessary,
		isAtBottom,
		isScrolledFarFromBottom,
		jumpToRef,
	};
};
