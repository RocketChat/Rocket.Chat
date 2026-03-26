import { useMergedRefs, useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { MutableRefObject, RefObject } from 'react';
import { useCallback, useRef } from 'react';

import { isAtBottom as isAtBottomLib } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import type { VirtualizerHandle } from '../../MessageList/MessageList';

export const useListIsAtBottom = (virtualizerRef?: RefObject<VirtualizerHandle | null>) => {
	const atBottomRef = useRef(true);

	const innerBoxRef = useRef<HTMLDivElement | null>(null);

	const sendToBottom = useCallback(() => {
		if (virtualizerRef?.current) {
			virtualizerRef.current.scrollToEnd();
			return;
		}
		innerBoxRef.current?.scrollTo({ left: 30, top: innerBoxRef.current?.scrollHeight });
	}, [virtualizerRef]);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			sendToBottom();
		}
	}, [sendToBottom]);

	// When a virtualizerRef is provided (main message list), atBottomRef is maintained by the
	// virtualizer's onChange callback in MessageList and isAtBottom delegates to the virtualizer.
	// The DOM-based fallback path is kept for the non-virtualized thread list.
	const isAtBottom = useCallback<(threshold?: number) => boolean>(
		(threshold = 0) => {
			if (virtualizerRef?.current) {
				return virtualizerRef.current.isAtBottom(threshold);
			}
			if (!innerBoxRef.current) {
				return true;
			}
			return isAtBottomLib(innerBoxRef.current, threshold);
		},
		[virtualizerRef],
	);

	const ref = useSafeRefCallback(
		useCallback(
			(node: HTMLElement) => {
				// For the virtualized main list, atBottomRef is updated by MessageList's onChange.
				// We only attach a DOM scroll listener for the non-virtualized thread list.
				if (virtualizerRef?.current) {
					return;
				}

				const handleScroll = withThrottling({ wait: 100 })(() => {
					atBottomRef.current = isAtBottom(100);
				});

				node.addEventListener('scroll', handleScroll, {
					passive: true,
				});

				return () => {
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
	};
};
