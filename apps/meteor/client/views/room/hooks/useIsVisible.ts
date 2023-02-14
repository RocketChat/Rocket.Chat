import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import type { RefObject } from 'react';
import { useEffect } from 'react';

export const useIsVisible = (ref: RefObject<HTMLInputElement>): [boolean] => {
	const [menuVisibility, setMenuVisibility] = useDebouncedState(!!window.DISABLE_ANIMATION, 100);

	useEffect(() => {
		if (!ref.current) {
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				setMenuVisibility(entry.isIntersecting);
			});
		});

		observer.observe(ref.current);

		return (): void => {
			observer.disconnect();
		};
	}, [setMenuVisibility, ref]);

	return [menuVisibility];
};
