import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { RefCallback, RefObject } from 'react';
import { useCallback, useRef } from 'react';

const userScrollEvents = ['wheel', 'touchmove', 'keydown', 'pointerdown', 'click'] as const;

/**
 * Tells scrolls the user performed apart from the ones the list does by itself, such as landing on the latest message when a room opens.
 * `onUserScroll` runs on every user interaction, since one made while already at the latest message produces no scroll to react to.
 */
export const useUserScrollIntent = (onUserScroll?: () => void): { ref: RefCallback<HTMLElement>; hasUserScrolled: RefObject<boolean> } => {
	const hasUserScrolled = useRef(false);

	const notifyUserScroll = useStableCallback(() => onUserScroll?.());

	const ref = useCallback(
		(node: HTMLElement) => {
			hasUserScrolled.current = false;

			const handleUserScroll = () => {
				hasUserScrolled.current = true;
				notifyUserScroll();
			};

			userScrollEvents.forEach((event) => node.addEventListener(event, handleUserScroll, { passive: true }));

			return () => {
				userScrollEvents.forEach((event) => node.removeEventListener(event, handleUserScroll));
			};
		},
		[notifyUserScroll],
	);

	return { ref, hasUserScrolled };
};
