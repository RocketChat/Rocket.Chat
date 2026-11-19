import { useCallback } from 'react';

export const useComposeEmail = () =>
	useCallback((address: string) => {
		window.open(`mailto:${address}`, '_self');
	}, []);
