import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useGoogleTagManager = () => {
	const i = useSetting<string>('GoogleTagManager_id');

	useEffect(() => {
		if (typeof i !== 'string' || i.trim() === '') {
			return;
		}

		const w: Window & { dataLayer?: { 'gtm.start': number; 'event': string }[] } = window;

		w.dataLayer = w.dataLayer || [];
		w.dataLayer.push({
			'gtm.start': new Date().getTime(),
			'event': 'gtm.js',
		});
		const f = document.getElementsByTagName('script')[0];
		const j = document.createElement('script');
		j.async = true;
		j.src = `//www.googletagmanager.com/gtm.js?id=${i}`;
		f.parentNode?.insertBefore(j, f);

		return () => {
			f.parentNode?.removeChild(j);
		};
	}, [i]);
};
