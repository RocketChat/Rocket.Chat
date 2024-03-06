import { useCallback, useRef, useState } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useLeaderBanner = () => {
	const [hideLeaderHeader, setHideLeaderHeader] = useState(false);

	const wrapperBoxRef = useRef<HTMLDivElement>(null);

	const innerScrollRef = useCallback((node: HTMLElement | null) => {
		if (!node) {
			return;
		}
		let lastScrollTopRef = 0;

		node.addEventListener(
			'scroll',
			withThrottling({ wait: 100 })((event) => {
				const roomLeader = wrapperBoxRef.current?.querySelector('.room-leader');
				if (roomLeader) {
					if (event.target.scrollTop < lastScrollTopRef) {
						setHideLeaderHeader(false);
					} else if (isAtBottom(node, 100) === false && event.target.scrollTop > parseFloat(getComputedStyle(roomLeader).height)) {
						setHideLeaderHeader(true);
					}
				}
				lastScrollTopRef = event.target.scrollTop;
			}),
			{ passive: true },
		);
	}, []);

	return {
		wrapperRef: wrapperBoxRef,
		hideLeaderHeader,
		innerRef: innerScrollRef,
	};
};
