import { useMemo } from 'react';

import { useTranslation } from '@rocket.chat/ui-contexts'
import { getPeriod, Period } from './periods';

export const usePeriodLabel = (period: Period['key']): string => {
	const t = useTranslation();

	return useMemo(() => t(...getPeriod(period).label), [period, t]);
};
