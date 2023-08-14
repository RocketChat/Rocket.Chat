import type { TranslationContextValue } from '@rocket.chat/ui-contexts';

import { getPeriod, type Period } from '../../../components/dashboards/periods';

export const formatPeriodDescription = (periodKey: Period['key'], t: TranslationContextValue['translate']) => {
	const { label } = getPeriod(periodKey);
	return t(...label).toLocaleLowerCase();
};
