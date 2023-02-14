import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { Period } from './periods';
import { getPeriod } from './periods';

export const usePeriodLabel = (period: Period['key']): string => {
	const t = useTranslation();

	return useMemo(() => t(...getPeriod(period).label), [period, t]);
};
