import { css } from '@rocket.chat/css-in-js';
import { Palette } from '@rocket.chat/fuselage';
import { OverlayScrollbars } from 'overlayscrollbars';
import type { RefCallback } from 'react';
import { useCallback } from 'react';

import { getScrollbarsOptions } from './BaseScrollbars';

/** Colors the scrollbars; goes on the parent of the scroll container. */
export const viewportScrollbarsHostStyle = css`
	.os-scrollbar {
		--os-handle-bg: ${Palette.stroke['stroke-dark']};
		--os-handle-bg-hover: ${Palette.stroke['stroke-dark']};
		--os-handle-bg-active: ${Palette.stroke['stroke-dark']};
	}
`;

/**
 * Draws the overlay scrollbars on a scroll container the caller already rendered, around its parent element. Unlike the
 * scrollbars components, the container exists from the first layout, which a virtualizer needs to find its scroll element.
 */
export const useViewportScrollbars = (): RefCallback<HTMLElement> =>
	useCallback((viewport: HTMLElement) => {
		const host = viewport.parentElement;
		if (!host) {
			return;
		}

		// oxlint-disable-next-line new-cap
		const instance = OverlayScrollbars({ target: host, elements: { viewport } }, getScrollbarsOptions());
		viewport.style.overflowX = 'var(--os-viewport-overflow-x)';
		viewport.style.overflowY = 'var(--os-viewport-overflow-y)';

		// The scrollbars only watch the viewport's children; content that grows deeper down, as a virtualizer's does, goes unseen
		const contentObserver = new ResizeObserver(() => instance.update());
		Array.from(viewport.children).forEach((child) => contentObserver.observe(child));

		return () => {
			contentObserver.disconnect();
			instance.destroy();
		};
	}, []);
