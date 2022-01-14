import { useEffect } from 'react';

export const useViewportScrolling = (active: boolean): void => {
	useEffect(() => {
		if (!active) {
			return;
		}

		document.documentElement.classList.remove('scroll');
		document.documentElement.classList.add('noscroll');

		return (): void => {
			document.documentElement.classList.add('scroll');
			document.documentElement.classList.remove('noscroll');
		};
	}, [active]);
};
