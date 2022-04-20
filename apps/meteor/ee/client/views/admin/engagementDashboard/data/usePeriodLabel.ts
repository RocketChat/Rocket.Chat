import { useMemo } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { getPeriod, Period } from './periods';

export const usePeriodLabel = (period: Period['key']): string => {
	const t = useTranslation();

	return useMemo(() => t(...getPeriod(period).label), [period, t]);
};
