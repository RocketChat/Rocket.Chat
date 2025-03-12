import { useEffect } from 'react';

export const useAutoupdate = () => {
	useEffect(() => {
		const fn = () => {
			console.log('---client_changed');
		};
		document.addEventListener('client_changed', fn);

		return () => {
			document.removeEventListener('client_changed', fn);
		};
	}, []);
};
