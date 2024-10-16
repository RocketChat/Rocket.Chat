import { useDebouncedState, useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

export const useIsVisible = () => {
	const [menuVisibility, setMenuVisibility] = useSafely(useDebouncedState(!!window.DISABLE_ANIMATION, 100));

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					setMenuVisibility(entry.isIntersecting);
				});
			});

			observer.observe(node);
		},
		[setMenuVisibility],
	);

	return [callbackRef, menuVisibility] as const;
};
