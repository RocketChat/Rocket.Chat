import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { FocusEvent } from 'react';
import { useState } from 'react';

type HeldHandlers<T extends HTMLElement> = {
	onPointerEnter: () => void;
	onPointerLeave: () => void;
	onFocus: () => void;
	onBlur: (event: FocusEvent<T>) => void;
};

/**
 * Whether someone is busy with an element: the pointer is over it, or focus is inside it. `onRelease` is called
 * when they let go of it.
 */
export const useHeld = <T extends HTMLElement>({ onRelease }: { onRelease: () => void }): [held: boolean, handlers: HeldHandlers<T>] => {
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);
	const release = useStableCallback(onRelease);

	const handlers: HeldHandlers<T> = {
		onPointerEnter: () => setHovered(true),
		onPointerLeave: () => {
			setHovered(false);
			if (!focused) {
				release();
			}
		},
		onFocus: () => setFocused(true),
		onBlur: (event) => {
			if (event.currentTarget.contains(event.relatedTarget)) {
				return;
			}

			setFocused(false);
			if (!hovered) {
				release();
			}
		},
	};

	return [hovered || focused, handlers];
};
