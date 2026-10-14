import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDebouncedState } from './useDebouncedState';
import { useSafely } from './useSafely';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
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
			if (node === null) {
				setMenuVisibility(false);
				return;
			}
			innerRef.current = node;

			observer.observe(innerRef.current);
		},
		[observer, setMenuVisibility],
	) as unknown as RefObject<T | null>;

	return [ref, menuVisibility];
};
