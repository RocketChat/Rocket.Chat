import { useEffect } from 'react';

export const useBodyPosition = (position: string, enabled = true): void => {
	useEffect(() => {
		if (!enabled) {
			return;
		}

		const previous = document.body.style.position;
		document.body.style.position = position;

		return (): void => {
			document.body.style.position = previous;
		};
	}, [position, enabled]);
};
