import { useLayoutEffect } from 'react';

export const useWipeInitialPageLoading = () => {
	useLayoutEffect(() => {
		const initialPageLoadingElement = document.getElementById('initial-page-loading');

		if (initialPageLoadingElement) {
			initialPageLoadingElement.style.display = 'none';
		}

		return () => {
			initialPageLoadingElement.style.display = 'flex';
		};
	}, []);
};
