import { useState } from 'react';

import type { Period } from './periods';

export const usePeriodSelectorState = <TPeriod extends Period['key']>(
	...periods: TPeriod[]
): [
	period: TPeriod,
	periodSelectorProps: {
		periods: TPeriod[];
		value: TPeriod;
		onChange: (value: TPeriod) => void;
	},
] => {
	const [period, setPeriod] = useState<TPeriod>(periods[0]);

	return [
		period,
		{
			periods,
			value: period,
			onChange: (value): void => setPeriod(value),
		},
	];
};
