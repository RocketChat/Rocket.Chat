import { useCallback, useRef, useState } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useBannerSection = () => {
	const [hideSection, setHideSection] = useState(false);

	const wrapperBoxRef = useRef<HTMLDivElement>(null);

	const innerScrollRef = useCallback((node: HTMLElement | null) => {
		if (!node) {
			return;
		}
		let lastScrollTopRef = 0;

		wrapperBoxRef.current?.addEventListener('mouseover', () => setHideSection(false));

		node.addEventListener(
			'scroll',
			withThrottling({ wait: 100 })((event) => {
				const roomLeader = wrapperBoxRef.current?.querySelector('.rcx-header-section');

				if (roomLeader) {
					if (isAtBottom(node, 0)) {
						setHideSection(false);
					} else if (event.target.scrollTop < lastScrollTopRef) {
						setHideSection(true);
					} else if (!isAtBottom(node, 100) && event.target.scrollTop > parseFloat(getComputedStyle(roomLeader).height)) {
						setHideSection(true);
					}
				}
				lastScrollTopRef = event.target.scrollTop;
			}),
			{ passive: true },
		);
	}, []);

	return {
		wrapperRef: wrapperBoxRef,
		hideSection,
		innerRef: innerScrollRef,
	};
};
