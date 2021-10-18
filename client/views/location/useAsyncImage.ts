import { useEffect } from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';

export const useAsyncImage = (src: string | undefined): string | undefined => {
	const { value, resolve, reject, reset } = useAsyncState<string>();

	useEffect(() => {
		reset();

		if (!src) {
			return;
		}

		const image = new Image();
		image.addEventListener('load', () => {
			resolve(image.src);
		});
		image.addEventListener('error', (e) => {
			reject(e.error);
		});
		image.src = src;
	}, [src, resolve, reject, reset]);

	return value;
};
