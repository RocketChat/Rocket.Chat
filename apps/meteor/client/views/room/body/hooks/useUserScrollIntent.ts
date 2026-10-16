import type { RefCallback, RefObject } from 'react';
import { useCallback, useRef } from 'react';

const userScrollEvents = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const;

/**
 * Tells scrolls the user performed apart from the ones the list does by itself, such as landing on the latest message when a room opens.
 */
export const useUserScrollIntent = (): { ref: RefCallback<HTMLElement>; hasUserScrolled: RefObject<boolean> } => {
	const hasUserScrolled = useRef(false);

	const ref = useCallback((node: HTMLElement) => {
		hasUserScrolled.current = false;

		const handleUserScroll = () => {
			hasUserScrolled.current = true;
		};

		userScrollEvents.forEach((event) => node.addEventListener(event, handleUserScroll, { passive: true }));

		return () => {
			userScrollEvents.forEach((event) => node.removeEventListener(event, handleUserScroll));
		};
	}, []);

	return { ref, hasUserScrolled };
};
