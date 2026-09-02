import { useLanguage } from '@rocket.chat/ui-contexts';
import cronstrue from 'cronstrue';
import { useCallback } from 'react';

export const useTranslateInterval = () => {
	const language = useLanguage();
	const locale = language?.replaceAll('-', '_') || 'en';

	return useCallback(
		(interval: string | number | undefined): string => {
			if (interval === undefined) {
				return '';
			}
			if (typeof interval === 'number') {
				return interval.toString();
			}
			try {
				return cronstrue.toString(interval, { locale });
			} catch {
				return interval;
			}
		},
		[locale],
	);
};
