import moment from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TranslationKey, useTranslation } from '../../../../../client/contexts/TranslationContext';

const periodKeys = ['last 7 days', 'last 30 days', 'last 90 days'] as const;

type PeriodKey = typeof periodKeys[number];

const periodLabelKeys: Record<PeriodKey, TranslationKey> = {
	'last 7 days': 'Last_7_days',
	'last 30 days': 'Last_30_days',
	'last 90 days': 'Last_90_days',
};

const isValidPeriodKey = (periodKey: string): periodKey is PeriodKey =>
	periodKeys.some((_periodKey) => _periodKey === periodKey);

const computePeriod = (
	periodKey: PeriodKey,
	utc: boolean,
): { readonly start: Date; readonly end: Date } => {
	switch (periodKey) {
		case 'last 7 days':
			return {
				start: utc
					? moment.utc().startOf('day').subtract(7, 'days').toDate()
					: moment().startOf('day').subtract(8, 'days').toDate(),
				end: utc
					? moment.utc().endOf('day').subtract(1, 'days').toDate()
					: moment().endOf('day').toDate(),
			};

		case 'last 30 days':
			return {
				start: utc
					? moment.utc().startOf('day').subtract(30, 'days').toDate()
					: moment().startOf('day').subtract(31, 'days').toDate(),
				end: utc
					? moment.utc().endOf('day').subtract(1, 'days').toDate()
					: moment().endOf('day').toDate(),
			};

		case 'last 90 days':
			return {
				start: utc
					? moment.utc().startOf('day').subtract(90, 'days').toDate()
					: moment().startOf('day').subtract(91, 'days').toDate(),
				end: utc
					? moment.utc().endOf('day').subtract(1, 'days').toDate()
					: moment().endOf('day').toDate(),
			};
	}
};

export const usePeriod = ({ utc = false }: { utc?: boolean } = {}): [
	period: { readonly start: Date; readonly end: Date },
	selectProps: {
		value: PeriodKey;
		options: readonly (readonly [periodKey: PeriodKey, label: string])[];
		onChange: (value: string) => void;
	},
	periodLabel: string,
] => {
	const t = useTranslation();

	const options = useMemo<readonly (readonly [periodKey: PeriodKey, label: string])[]>(
		() => periodKeys.map((periodKey) => [periodKey, t(periodLabelKeys[periodKey])]),
		[t],
	);

	const [periodKey, setPeriodKey] = useState<PeriodKey>(periodKeys[0]);

	const onChange = useCallback((value: string): void => {
		if (isValidPeriodKey(value)) {
			setPeriodKey(value);
		}
	}, []);

	const [period, setPeriod] = useState(() => computePeriod(periodKey, utc));

	useEffect(() => {
		const updatePeriod = (): void => setPeriod(computePeriod(periodKey, utc));

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
		t(periodLabelKeys[periodKey]),
	];
};
