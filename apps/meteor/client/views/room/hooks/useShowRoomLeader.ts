import type { MutableRefObject } from 'react';
import { useCallback, useRef, useState } from 'react';

import { withThrottling } from '../../../../lib/utils/highOrderFunctions';

export const useShowRoomLeader = (isAtBottom: MutableRefObject<boolean>) => {
	const [showRoomLeader, setShowRoomLeader] = useState(false);

	const lastScrollTopRef = useRef(0);

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const handleWrapperScroll = withThrottling({ wait: 100 })((event) => {
				console.log('handleWrapperScroll', showRoomLeader, event.target.scrollTop, lastScrollTopRef.current);
				const roomLeader = node.querySelector('.room-leader');
				if (!roomLeader) {
					console.log('roomLeader not found');
					return;
				}

				if (event.target.scrollTop < lastScrollTopRef.current) {
					setShowRoomLeader(true);
				} else if (isAtBottom.current === false && event.target.scrollTop > parseFloat(getComputedStyle(roomLeader).height)) {
					setShowRoomLeader(false);
				}
				lastScrollTopRef.current = event.target.scrollTop;
			});

			node.addEventListener('scroll', handleWrapperScroll, { passive: true });
		},
		[isAtBottom],
	);

	return { ref: callbackRef, showRoomLeader };
};
