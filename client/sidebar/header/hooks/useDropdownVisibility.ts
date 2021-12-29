import { useToggle } from '@rocket.chat/fuselage-hooks';
import { RefObject, useCallback } from 'react';

import { useOutsideClick } from '../../../hooks/useOutsideClick';

/**
 * useDropdownVisibility
 * is used to control the visibility of a dropdown
 * also checks if the user clicked outside the dropdown, but ignores if the click was on the anchor
 * @param {Object} props
 * @param {Object} props.reference - The reference where the dropdown will be attached to
 * @param {Object} props.target - The target, the dropdown itself
 * @returns {Object}
 * @returns {Boolean} isVisible - The visibility of the dropdown
 * @returns {Function} toggle - The function to toggle the dropdown
 */

export const useDropdownVisibility = <T extends HTMLElement>({
	reference,
	target,
}: {
	reference?: RefObject<T>;
	target: RefObject<T>;
}): {
	isVisible: boolean;
	toggle: (state?: boolean) => void;
} => {
	const [isVisible, toggle] = useToggle(false);

	useOutsideClick(
		target,
		useCallback(
			(event: MouseEvent) => {
				if (!reference || !reference.current || !reference.current.contains(event.target as Node)) {
					toggle(false);
				}
			},
			[reference, toggle],
		),
	);

	return {
		isVisible,
		toggle,
	};
};
