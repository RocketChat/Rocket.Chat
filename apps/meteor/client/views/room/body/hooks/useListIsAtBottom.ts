import { useCallback, useRef } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useListIsAtBottom = () => {
	const atBottomRef = useRef(true);

	const ref = useCallback((node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		node.addEventListener(
			'scroll',
			withThrottling({ wait: 100 })(() => {
				atBottomRef.current = isAtBottom(node, 100);
			}),
			{
				passive: true,
			},
		);
	}, []);

	return {
		atBottomRef,
		innerRef: ref,
	};
};
