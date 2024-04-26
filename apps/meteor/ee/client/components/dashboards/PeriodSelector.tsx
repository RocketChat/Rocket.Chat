import { Select } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import type { Period } from './periods';
import { getPeriod } from './periods';

type PeriodSelectorProps<TPeriod extends Period['key']> = {
	periods: TPeriod[];
	value: TPeriod;
	name?: string;
	onChange: (value: TPeriod) => void;
};

const PeriodSelector = <TPeriod extends Period['key']>({ periods, value, name, onChange }: PeriodSelectorProps<TPeriod>): ReactElement => {
	const t = useTranslation();

	const options = useMemo<[string, string][]>(() => periods.map((period) => [period, t(...getPeriod(period).label)]), [periods, t]);

	return (
		<Select
			name={name}
			options={options}
			value={value}
			onChange={(value): void => onChange(value as TPeriod)}
			aria-label={t('Select_period')}
		/>
	);
};

export default PeriodSelector;
