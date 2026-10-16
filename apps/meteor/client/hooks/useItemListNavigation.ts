import { createFocusManager } from '@react-aria/focus';
import type { RefCallback } from 'react';
import { useCallback, useRef } from 'react';

const isItemLink = (node: Element) => node.classList.contains('rcx-item__link');

/**
 * Makes a list of `Item` rows a single tab stop, as the sidebar room list is: the arrow keys move between rows, including rows a
 * virtualized list has not rendered yet, and between a row's `ItemLink` and its `ItemActions`, and Tab leaves the list. Coming
 * back to the list by keyboard returns to the row focused last.
 */
export const useItemListNavigation = (): RefCallback<HTMLElement> => {
	const cleanupRef = useRef<(() => void) | null>(null);

	return useCallback((node: HTMLElement | null) => {
		cleanupRef.current?.();
		cleanupRef.current = null;

		if (!node) return;

		const focusManager = createFocusManager({ current: node });
		const documentFocusManager = createFocusManager({ current: node.ownerDocument.body });
		let lastItemLink: HTMLElement | null = null;

		const leaveList = (e: KeyboardEvent) => {
			const outsideList = { from: node, tabbable: true, accept: (element: Element) => !node.contains(element) };
			const left = e.shiftKey ? documentFocusManager.focusPrevious(outsideList) : documentFocusManager.focusNext(outsideList);
			if (left) e.preventDefault();
		};

		const moveBetweenRows = (e: KeyboardEvent, itemLink: HTMLElement) => {
			e.preventDefault();
			e.stopPropagation();

			const isUp = e.key === 'ArrowUp';
			const moved = isUp ? focusManager.focusPrevious({ accept: isItemLink }) : focusManager.focusNext({ accept: isItemLink });

			if (moved) return;

			// The adjacent row is outside the render window: scroll it in and retry
			const scroller = itemLink.closest<HTMLElement>('[data-virtuoso-scroller]');
			const itemHeight = (itemLink.closest<HTMLElement>('.rcx-item') ?? itemLink).offsetHeight;
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

		const onKeyDown = (e: Event) => {
			if (!(e instanceof KeyboardEvent) || !(e.target instanceof HTMLElement)) return;

			if (e.key === 'Tab') {
				leaveList(e);
				return;
			}

			const row = e.target.closest<HTMLElement>('.rcx-item');
			if (!row || !node.contains(row)) return;

			const isRtl = getComputedStyle(row).direction === 'rtl';
			const towardsActions = isRtl ? 'ArrowLeft' : 'ArrowRight';
			const towardsLink = isRtl ? 'ArrowRight' : 'ArrowLeft';

			if (isItemLink(e.target)) {
				if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
					moveBetweenRows(e, e.target);
					return;
				}

				const actions = row.querySelector<HTMLElement>('.rcx-item__actions');
				if (e.key === towardsActions && actions && createFocusManager({ current: actions }).focusFirst({ tabbable: true })) {
					e.preventDefault();
				}
				return;
			}

			if (e.key === towardsLink && e.target.closest('.rcx-item__actions')) {
				const itemLink = row.querySelector<HTMLElement>('.rcx-item__link');
				if (!itemLink) return;
				e.preventDefault();
				itemLink.focus();
			}
		};

		const onFocusIn = (e: FocusEvent) => {
			if (!(e.target instanceof HTMLElement) || !isItemLink(e.target)) return;

			const enteredFromOutside = !(e.relatedTarget instanceof Node && node.contains(e.relatedTarget));
			if (
				enteredFromOutside &&
				e.target.matches(':focus-visible') &&
				lastItemLink &&
				lastItemLink !== e.target &&
				node.contains(lastItemLink)
			) {
				lastItemLink.focus();
				return;
			}

			lastItemLink = e.target;
		};

		node.addEventListener('keydown', onKeyDown);
		node.addEventListener('focusin', onFocusIn);
		cleanupRef.current = () => {
			node.removeEventListener('keydown', onKeyDown);
			node.removeEventListener('focusin', onFocusIn);
		};
	}, []);
};
