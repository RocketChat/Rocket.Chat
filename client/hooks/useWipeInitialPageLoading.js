import { useLayoutEffect } from 'react';

export const useWipeInitialPageLoading = () => {
	useLayoutEffect(() => {
		const initialPageLoadingElement = document.getElementById('initial-page-loading');

		if (!initialPageLoadingElement) {
			return;
		}

		initialPageLoadingElement.style.display = 'none';

		return () => {
			initialPageLoadingElement.style.display = 'flex';
		};
	}, []);
};
