import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDebouncedState } from './useDebouncedState';
import { useSafely } from './useSafely';

declare global {
	interface Window {
		DISABLE_ANIMATION: boolean;
	}
}

export const useElementIsVisible = <T extends Element>(): [ref: RefObject<T | null>, isVisible: boolean] => {
	const innerRef = useRef<T>(undefined);

	const [menuVisibility, setMenuVisibility] = useSafely(useDebouncedState(false, 100));

	const [observer] = useState(
		() =>
			new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.target !== innerRef.current) {
						return;
					}
					setMenuVisibility(entry.isIntersecting);
				});
			}),
	);

	useEffect(
		() => () => {
			observer.disconnect();
		},
		[observer],
	);

	const ref = useCallback(
		(node: T | null) => {
			if (innerRef.current) {
				observer.unobserve(innerRef.current);
			}
			innerRef.current = node ?? undefined;

			if (node === null) {
				setMenuVisibility(false);
				return;
			}

			observer.observe(node);
		},
		[observer, setMenuVisibility],
	) as unknown as RefObject<T | null>;

	return [ref, menuVisibility];
};
