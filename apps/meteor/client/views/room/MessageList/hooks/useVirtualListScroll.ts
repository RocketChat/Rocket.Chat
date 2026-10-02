import type { MutableRefObject } from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import type { VirtualizerHandle } from 'virtua';

type ScrollMetrics = Pick<VirtualizerHandle, 'scrollSize' | 'viewportSize'>;

export const isScrolledToBottom = (offset: number, { scrollSize, viewportSize }: ScrollMetrics, threshold: number): boolean =>
	offset - scrollSize + viewportSize >= -threshold;

type UseVirtualListScrollOptions = {
	isAtBottom: MutableRefObject<boolean | null>;
	/** While newer messages are still unloaded, the list is never at the bottom, whatever its scroll offset. */
	hasMoreNext: boolean;
	/** How close to the end, in pixels, still counts as being at the bottom. */
	bottomThreshold: number;
};

/**
 * The scroll state a virtualized message list shares with its surroundings: the virtualizer handle and whether the
 * viewport sits at the bottom of the list, kept up to date from the list's scroll events.
 */
export const useVirtualListScroll = ({ isAtBottom, hasMoreNext, bottomThreshold }: UseVirtualListScrollOptions) => {
	const virtualizerRef = useRef<VirtualizerHandle | null>(null);

	useLayoutEffect(() => {
		if (hasMoreNext) {
			isAtBottom.current = false;
		}
	});

	const trackScroll = useCallback(
		(offset: number): boolean => {
			const handle = virtualizerRef.current;
			isAtBottom.current =
				!hasMoreNext &&
				isScrolledToBottom(offset, { scrollSize: handle?.scrollSize ?? 0, viewportSize: handle?.viewportSize ?? 0 }, bottomThreshold);

			return isAtBottom.current;
		},
		[isAtBottom, hasMoreNext, bottomThreshold],
	);

	return { virtualizerRef, trackScroll };
};
