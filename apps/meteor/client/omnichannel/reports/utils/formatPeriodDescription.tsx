import type { TFunction } from 'i18next';

import { getPeriod, type Period } from '../../../components/dashboards/periods';

export const formatPeriodDescription = (periodKey: Period['key'], t: TFunction) => {
	const { label } = getPeriod(periodKey);
	return t(...label).toLocaleLowerCase();
};
