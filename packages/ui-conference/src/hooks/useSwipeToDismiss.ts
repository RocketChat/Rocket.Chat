import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { RefCallback } from 'react';
import { useCallback } from 'react';

/** How far a finger travels before it is a swipe rather than an unsteady tap. */
const SWIPE_SLOP_PX = 8;

/** The share of the element's width a swipe has to cross to dismiss it. */
const SWIPE_DISMISS_RATIO = 0.35;

/** Lets a finger drag the element sideways to dismiss it; it follows the finger and springs back from a short drag. */
export const useSwipeToDismiss = (onDismiss: () => void): RefCallback<HTMLElement> => {
	const dismiss = useStableCallback(onDismiss);

	return useCallback(
		(node: HTMLElement) => {
			let startX: number | undefined;

			const follow = (distance: number) => {
				const swiping = Math.abs(distance) > SWIPE_SLOP_PX;
				node.style.transform = swiping ? `translateX(${distance}px)` : '';
				node.style.opacity = swiping ? String(1 - Math.min(Math.abs(distance) / node.offsetWidth, 1)) : '';
			};

			const handlePointerDown = (event: PointerEvent) => {
				if (event.pointerType === 'touch') {
					startX = event.clientX;
				}
			};

			const handlePointerMove = (event: PointerEvent) => {
				if (startX !== undefined) {
					follow(event.clientX - startX);
				}
			};

			const handlePointerUp = (event: PointerEvent) => {
				if (startX === undefined) {
					return;
				}

				const distance = event.clientX - startX;
				startX = undefined;

				if (Math.abs(distance) > node.offsetWidth * SWIPE_DISMISS_RATIO) {
					dismiss();
					return;
				}

				follow(0);
			};

			const handlePointerCancel = () => {
				startX = undefined;
				follow(0);
			};

			node.addEventListener('pointerdown', handlePointerDown);
			node.addEventListener('pointermove', handlePointerMove);
			node.addEventListener('pointerup', handlePointerUp);
			node.addEventListener('pointercancel', handlePointerCancel);

			return () => {
				node.removeEventListener('pointerdown', handlePointerDown);
				node.removeEventListener('pointermove', handlePointerMove);
				node.removeEventListener('pointerup', handlePointerUp);
				node.removeEventListener('pointercancel', handlePointerCancel);
			};
		},
		[dismiss],
	);
};
