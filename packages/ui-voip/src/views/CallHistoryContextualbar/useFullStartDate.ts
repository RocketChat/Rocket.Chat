import { useLanguage } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useFullStartDate = (startedAt: Date) => {
	const locale = useLanguage();

	const date = useMemo(() => {
		// eslint-disable-next-line new-cap
		return Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'medium' }).format(startedAt);
	}, [locale, startedAt]);

	return date;
};
