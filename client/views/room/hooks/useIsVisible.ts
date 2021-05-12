import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import { useEffect, MutableRefObject } from 'react';

export const useIsVisible = (ref: MutableRefObject<HTMLInputElement | undefined>): [boolean] => {
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
