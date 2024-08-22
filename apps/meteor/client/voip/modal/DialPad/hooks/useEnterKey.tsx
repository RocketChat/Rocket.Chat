import { useEffect } from 'react';

export const useEnterKey = (onEnter: () => void, disabled: boolean): void => {
	useEffect(() => {
		const sendOnEnter = (e: KeyboardEvent): void => {
			if (e.key !== 'Enter' || disabled) {
				return;
			}

			e.stopPropagation();
			onEnter();
		};

		window.addEventListener('keydown', sendOnEnter);

		return (): void => {
			window.removeEventListener('keydown', sendOnEnter);
		};
	}, [disabled, onEnter]);
};
