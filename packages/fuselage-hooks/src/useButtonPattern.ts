import type { MouseEvent, KeyboardEvent } from 'react';
import { useCallback } from 'react';

/**
 * A React hook to make any HTML element behave like an accessible button,
 * allowing it to be activated by both mouse clicks and keyboard (Enter/Spacebar).
 *
 * This hook is particularly useful when you need to use a non-button element (like a div or span)
 * but still want it to be fully accessible to screen readers and keyboard users,
 * adhering to WCAG guidelines.
 *
 * @param onPress The function to call when the element is clicked or activated by keyboard.
 * @returns An object containing props (onClick, onKeyDown, role, tabIndex)
 * to be spread onto the target HTML element.
 *
 * @example
 * // Example for a div acting as a button
 * const handleDivAction = () => console.log('Div button activated!');
 * const divButtonProps = useAccessibleClick(handleDivAction);
 * <div {...divButtonProps} className="my-accessible-div">Click Me</div>
 */

export const useButtonPattern = (onPress: (e: MouseEvent<Element> | KeyboardEvent<Element>) => void) => {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent<Element>) => {
			if (event.code === 'Space' || event.code === 'Enter') {
				event.preventDefault();
				onPress(event);
			}
		},
		[onPress],
	);

	return {
		onClick: onPress,
		onKeyDown: handleKeyDown,
		role: 'button',
		tabIndex: 0,
	};
};
