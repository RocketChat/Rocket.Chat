import { Select } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { getPeriod, Period } from './periods';

type PeriodSelectorProps<TPeriod extends Period['key']> = {
	periods: TPeriod[];
	value: TPeriod;
	onChange: (value: TPeriod) => void;
};

const PeriodSelector = <TPeriod extends Period['key']>({ periods, value, onChange }: PeriodSelectorProps<TPeriod>): ReactElement => {
	const t = useTranslation();

	const options = useMemo<[string, string][]>(() => periods.map((period) => [period, t(...getPeriod(period).label)]), [periods, t]);

	return <Select options={options} value={value} onChange={(value: string): void => onChange(value as TPeriod)} />;
};

export default PeriodSelector;
