import { useDebouncedState, useSafely } from '@rocket.chat/fuselage-hooks';
import type { RefCallback } from 'react';
import { useCallback } from 'react';

export const useIsVisible = () => {
	const [menuVisibility, setMenuVisibility] = useSafely(useDebouncedState(!!window.DISABLE_ANIMATION, 100));

	const callbackRef: RefCallback<HTMLElement> = useCallback(
		(node: HTMLElement) => {
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					setMenuVisibility(entry.isIntersecting);
				});
			});

			observer.observe(node);

			return () => {
				observer.disconnect();
			};
		},
		[setMenuVisibility],
	);

	return [callbackRef, menuVisibility] as const;
};
