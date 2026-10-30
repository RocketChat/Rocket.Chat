import type { SetStateAction } from 'react';
import { useState } from 'react';

import { useStableCallback } from './useStableCallback.js';

/**
 * Tracks the active option of a listbox whose DOM focus stays on its combobox, and whether that option shows its focus ring:
 * the ring shows while the keyboard drives the list and hides once the pointer does.
 *
 * @returns the active option, whether it shows its focus ring, and the setters that move it by keyboard or by pointer
 * @public
 */
export const useActiveDescendant = <T>() => {
	const [active, setActive] = useState<T>();
	const [focusVisible, setFocusVisible] = useState(false);

	const moveByKeyboard = useStableCallback((next: SetStateAction<T | undefined>) => {
		setActive(next);
		setFocusVisible(true);
	});

	const moveByPointer = useStableCallback((item: T) => {
		setActive(item);
		setFocusVisible(false);
	});

	return { active, setActive, focusVisible, setFocusVisible, moveByKeyboard, moveByPointer };
};
