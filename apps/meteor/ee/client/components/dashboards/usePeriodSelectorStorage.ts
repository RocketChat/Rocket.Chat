import { useLocalStorage } from '@rocket.chat/fuselage-hooks';

import type { Period } from './periods';

export const usePeriodSelectorStorage = <TPeriod extends Period['key']>(
	storageKey: string,
	periods: TPeriod[],
): [
	period: TPeriod,
	periodSelectorProps: {
		periods: TPeriod[];
		value: TPeriod;
		onChange: (value: TPeriod) => void;
	},
] => {
	const [period, setPeriod] = useLocalStorage<TPeriod>(storageKey, periods[0]);

	return [
		period,
		{
			periods,
			value: period,
			onChange: (value): void => setPeriod(value),
		},
	];
};
