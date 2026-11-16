import type { VirtualizerHandle } from 'virtua';

// virtua measures a resize a frame after the browser clamps the scroll, so the scroller's own sizes are preferred.
export const getDistanceFromBottom = (scroller: HTMLElement | null, virtualizer: VirtualizerHandle, offset: number): number => {
	if (scroller) {
		return scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
	}

	return virtualizer.scrollSize - virtualizer.viewportSize - offset;
};
