import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { getPeriod, getPeriodRange, Period, periods } from './utils/periods';

const isValidPeriodKey = (periodKey: string): periodKey is Period['key'] =>
	periods.some((period) => period.key === periodKey);

export const usePeriod = ({ utc = false }: { utc?: boolean } = {}): [
	period: { readonly start: Date; readonly end: Date },
	selectProps: {
		value: Period['key'];
		options: readonly (readonly [periodKey: Period['key'], label: string])[];
		onChange: (value: string) => void;
	},
	periodLabel: string,
] => {
	const t = useTranslation();

	const options = useMemo<readonly (readonly [periodKey: Period['key'], label: string])[]>(
		() => periods.map(({ key, label }) => [key, t(...label)]),
		[t],
	);

	const [periodKey, setPeriodKey] = useState<Period['key']>(periods[0].key);

	const onChange = useCallback((value: string): void => {
		if (isValidPeriodKey(value)) {
			setPeriodKey(value);
		}
	}, []);

	const [period, setPeriod] = useState(() => getPeriodRange(periodKey, utc));

	useEffect(() => {
		const updatePeriod = (): void => setPeriod(getPeriodRange(periodKey, utc));

		updatePeriod();
		const timer = setInterval(updatePeriod, 60 * 60 * 1000);

		return (): void => {
			clearInterval(timer);
		};
	}, [periodKey, utc]);

	return [
		period,
		{
			value: periodKey,
			options,
			onChange,
		},
		t(...getPeriod(periodKey).label),
	];
};
