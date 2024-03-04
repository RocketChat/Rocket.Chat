import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useCallback, useRef } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { useScrollMessageList } from '../../hooks/useScrollMessageList';

export const useCheckIfIsAtBottom = () => {
	const ref = useRef<boolean>(false);

	const { ref: callbackRefScrollMessageList, scrollTo } = useScrollMessageList(
		useCallback((wrapper) => ({ left: 30, top: wrapper?.scrollHeight }), []),
	);

	const callbackRef = useCallback((node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		const checkIfScrollIsAtBottom = () => {
			ref.current = isAtBottom(node, 50);
		};

		const handleWheel = withThrottling({ wait: 30 })(() => {
			checkIfScrollIsAtBottom();
		});

		node.addEventListener('scroll', handleWheel, { passive: true });
	}, []);

	const sendToBottom = useCallback(() => {
		scrollTo();
	}, [scrollTo]);

	const sendToBottomIfNecessary = useCallback(() => {
		if (ref.current === true) {
			sendToBottom();
		}
	}, [sendToBottom]);

	return { ref: useMergedRefs(callbackRef, callbackRefScrollMessageList), isAtBottom: ref, sendToBottomIfNecessary, sendToBottom };
};

export const useSendToBottomIfNecessaryObserver = (cb: () => void) => {
	return useCallback(
		(element: HTMLElement | null) => {
			if (!element) {
				return;
			}
			const messageList = element.querySelector('ul');

			if (!messageList) {
				return;
			}

			const observer = new ResizeObserver(() => {
				cb();
			});

			observer.observe(messageList);
		},
		[cb],
	);
};
