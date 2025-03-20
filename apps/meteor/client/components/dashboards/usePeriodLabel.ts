import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Period } from './periods';
import { getPeriod } from './periods';

export const usePeriodLabel = (period: Period['key']): string => {
	const { t } = useTranslation();

	return useMemo(() => t(...getPeriod(period).label), [period, t]);
};
