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
