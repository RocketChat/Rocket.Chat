import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { RefObject } from 'react';
import { useCallback, useRef } from 'react';

import type { VirtualizerHandle } from '../MessageList';

export const useJumpToMessageImperative = (virtualizerRef?: RefObject<VirtualizerHandle | null>) => {
	const jumpToRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const jumpToRefAction = useCallback(() => {
		if (virtualizerRef?.current) {
			return;
		}
		if (!jumpToRef.current || !containerRef.current) {
			return;
		}
		// calculate the scroll position to center the message
		// avoiding scrollIntoView because it will can scroll parent elements
		containerRef.current.scrollTop =
			jumpToRef.current.offsetTop - containerRef.current.clientHeight / 2 + jumpToRef.current.offsetHeight / 2;
	}, [virtualizerRef]);

	return {
		jumpToRef: useMergedRefs(jumpToRef, jumpToRefAction),
		innerRef: useMergedRefs(containerRef, jumpToRefAction),
	};
};
