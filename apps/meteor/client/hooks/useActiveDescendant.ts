import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { SetStateAction } from 'react';
import { useState } from 'react';

/**
 * Tracks the active option of a listbox whose DOM focus stays on its combobox, and whether that option shows its focus ring:
 * the ring shows while the keyboard drives the list and hides once the pointer does.
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

/**
 * Props that render a listbox option as its combobox's active descendant, and hand it to the pointer when the pointer moves over it.
 */
export const getActiveDescendantOptionProps = (isActive: boolean, focusVisible: boolean, activate: () => void) => ({
	'focused': isActive,
	'focusVisible': focusVisible && isActive,
	'aria-selected': isActive,
	'tabIndex': -1,
	'onPointerMove': () => {
		if (!isActive || focusVisible) {
			activate();
		}
	},
});
