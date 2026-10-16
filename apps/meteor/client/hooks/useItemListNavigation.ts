import { createFocusManager } from '@react-aria/focus';
import type { RefCallback } from 'react';
import { useCallback, useRef } from 'react';

const isItemLink = (node: Element) => node.classList.contains('rcx-item__link');

/**
 * Moves focus between the `ItemLink`s of a list of `Item` rows with the arrow keys, including rows a virtualized list has not rendered yet.
 */
export const useItemListNavigation = (): RefCallback<HTMLElement> => {
	const cleanupRef = useRef<(() => void) | null>(null);

	return useCallback((node: HTMLElement | null) => {
		cleanupRef.current?.();
		cleanupRef.current = null;

		if (!node) return;

		const focusManager = createFocusManager({ current: node });

		const onKeyDown = (e: Event) => {
			if (!(e.target instanceof HTMLElement) || !isItemLink(e.target)) return;
			if (!(e instanceof KeyboardEvent) || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;

			e.preventDefault();
			e.stopPropagation();

			const isUp = e.key === 'ArrowUp';
			const moved = isUp ? focusManager.focusPrevious({ accept: isItemLink }) : focusManager.focusNext({ accept: isItemLink });

			if (moved) return;

			// The adjacent row is outside the render window: scroll it in and retry
			const scroller = e.target.closest<HTMLElement>('[data-virtuoso-scroller]');
			const itemHeight = (e.target.closest<HTMLElement>('.rcx-item') ?? e.target).offsetHeight;
			if (!scroller || itemHeight <= 0) return;

			scroller.scrollTop = isUp ? Math.max(0, scroller.scrollTop - itemHeight) : scroller.scrollTop + itemHeight;
			requestAnimationFrame(() => {
				if (!node.isConnected) return;
				if (isUp) {
					focusManager.focusPrevious({ accept: isItemLink });
				} else {
					focusManager.focusNext({ accept: isItemLink });
				}
			});
		};

		node.addEventListener('keydown', onKeyDown);
		cleanupRef.current = () => node.removeEventListener('keydown', onKeyDown);
	}, []);
};
