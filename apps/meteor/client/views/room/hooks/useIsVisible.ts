import { useDebouncedState, useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useRef } from 'react';

export const useIsVisible = () => {
	const [menuVisibility, setMenuVisibility] = useSafely(useDebouncedState(!!window.DISABLE_ANIMATION, 100));
	const disconnectObserverRef = useRef<(() => void) | null>(null);

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			disconnectObserverRef.current?.();

			if (!node) {
				return;
			}
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					setMenuVisibility(entry.isIntersecting);
				});
			});

			observer.observe(node);

			disconnectObserverRef.current = () => observer.disconnect();
		},
		[setMenuVisibility],
	);

	return [callbackRef, menuVisibility] as const;
};
