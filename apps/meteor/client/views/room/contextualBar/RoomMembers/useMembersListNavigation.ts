import { createFocusManager } from '@react-aria/focus';
import type { RefCallback } from 'react';
import { useCallback, useRef } from 'react';

const isMemberItem = (node: Element) => node.tagName === 'LI';

export const useMembersListNavigation = (): { membersListRef: RefCallback<HTMLElement> } => {
	const cleanupRef = useRef<(() => void) | null>(null);

	const membersListRef: RefCallback<HTMLElement> = useCallback((node) => {
		cleanupRef.current?.();
		cleanupRef.current = null;

		if (!node) return;

		const focusManager = createFocusManager({ current: node });

		const onKeyDown = (e: Event) => {
			if (!(e.target instanceof Element) || !isMemberItem(e.target)) return;
			if (!(e instanceof KeyboardEvent) || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;

			e.preventDefault();
			e.stopPropagation();

			const isUp = e.key === 'ArrowUp';
			const moved = isUp ? focusManager.focusPrevious({ accept: isMemberItem }) : focusManager.focusNext({ accept: isMemberItem });

			if (moved) return;

			// Adjacent item is outside the render window — scroll by one row height and retry
			let scroller: HTMLElement | null = node.parentElement;
			while (scroller && getComputedStyle(scroller).overflowY === 'visible') {
				scroller = scroller.parentElement;
			}
			const itemHeight = (e.target as HTMLElement).offsetHeight;
			if (!scroller || itemHeight <= 0) return;

			scroller.scrollTop = isUp ? Math.max(0, scroller.scrollTop - itemHeight) : scroller.scrollTop + itemHeight;
			requestAnimationFrame(() => {
				if (!node.isConnected) return;
				if (isUp) {
					focusManager.focusPrevious({ accept: isMemberItem });
				} else {
					focusManager.focusNext({ accept: isMemberItem });
				}
			});
		};

		node.addEventListener('keydown', onKeyDown);
		cleanupRef.current = () => node.removeEventListener('keydown', onKeyDown);
	}, []);

	return { membersListRef };
};
