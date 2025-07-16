import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { DurationInputArg1, DurationInputArg2 } from 'moment';
import moment from 'moment';

const label = (translationKey: TranslationKey): readonly [translationKey: TranslationKey] => [translationKey];

export const getClosedPeriod =
	({
		startOf,
		subtract,
	}: {
		startOf: 'day' | 'year' | 'month' | 'week';
		subtract?: { amount: DurationInputArg1; unit: DurationInputArg2 };
	}): ((utc: boolean) => {
		start: Date;
		end: Date;
	}) =>
	(utc): { start: Date; end: Date } => {
		const start = utc ? moment().utc() : moment();
		const end = utc ? moment().utc() : moment();

		if (subtract) {
			const { amount, unit } = subtract;
			start.subtract(amount, unit);
		}

		return {
			start: start.startOf(startOf).toDate(),
			end: end.endOf('day').toDate(),
		};
	};

const periods = [
	{
		key: 'today',
		label: label('Today'),
		range: getClosedPeriod({ startOf: 'day' }),
	},
	{
		key: 'this week',
		label: label('This_week'),
		range: getClosedPeriod({ startOf: 'week' }),
	},
	{
		key: 'last 7 days',
		label: label('Last_7_days'),
		range: getClosedPeriod({ startOf: 'day', subtract: { amount: 7, unit: 'days' } }),
	},
	{
		key: 'last 15 days',
		label: label('Last_15_days'),
		range: getClosedPeriod({ startOf: 'day', subtract: { amount: 15, unit: 'days' } }),
	},
	{
		key: 'this month',
		label: label('This_month'),
		range: getClosedPeriod({ startOf: 'month' }),
	},
	{
		key: 'last 30 days',
		label: label('Last_30_days'),
		range: getClosedPeriod({ startOf: 'day', subtract: { amount: 30, unit: 'days' } }),
	},
	{
		key: 'last 90 days',
		label: label('Last_90_days'),
		range: getClosedPeriod({ startOf: 'day', subtract: { amount: 90, unit: 'days' } }),
	},
	{
		key: 'last 6 months',
		label: label('Last_6_months'),
		range: getClosedPeriod({ startOf: 'month', subtract: { amount: 6, unit: 'months' } }),
	},
	{
		key: 'this year',
		label: label('This_year'),
		range: getClosedPeriod({ startOf: 'year' }),
	},
] as const;

export type Period = (typeof periods)[number];

export const getPeriod = (key: (typeof periods)[number]['key']): Period => {
	const period = periods.find((period) => period.key === key);

	if (!period) {
		return periods[0];
	}

	return period;
};

export const getPeriodRange = (
	key: (typeof periods)[number]['key'],
	utc = true,
): {
	start: Date;
	end: Date;
} => {
	const period = periods.find((period) => period.key === key);

	if (!period) {
		return periods[0].range(utc);
	}

	return period.range(utc);
};
