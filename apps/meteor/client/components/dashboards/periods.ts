import type { TranslationKey } from '@rocket.chat/ui-contexts';
import moment from 'moment';

const lastNDays =
	(
		n: number,
	): ((utc: boolean) => {
		start: Date;
		end: Date;
	}) =>
	(utc): { start: Date; end: Date } => {
		const date = new Date();
		const offsetForMoment = -(date.getTimezoneOffset() / 60);

		const start = utc
			? moment.utc().startOf('day').subtract(n, 'days').toDate()
			: moment().subtract(n, 'days').startOf('day').utcOffset(offsetForMoment).toDate();

		const end = utc ? moment.utc().endOf('day').toDate() : moment().endOf('day').utcOffset(offsetForMoment).toDate();

		return { start, end };
	};

const periods = [
	{
		key: 'today',
		label: 'Today' as TranslationKey,
		range: lastNDays(0),
	},
	{
		key: 'this week',
		label: 'This_week' as TranslationKey,
		range: lastNDays(7),
	},
	{
		key: 'last 7 days',
		label: 'Last_7_days' as TranslationKey,
		range: lastNDays(7),
	},
	{
		key: 'last 15 days',
		label: 'Last_15_days' as TranslationKey,
		range: lastNDays(15),
	},
	{
		key: 'this month',
		label: 'This_month' as TranslationKey,
		range: lastNDays(30),
	},
	{
		key: 'last 30 days',
		label: 'Last_30_days' as TranslationKey,
		range: lastNDays(30),
	},
	{
		key: 'last 90 days',
		label: 'Last_90_days' as TranslationKey,
		range: lastNDays(90),
	},
	{
		key: 'last 6 months',
		label: 'Last_6_months' as TranslationKey,
		range: lastNDays(180),
	},
	{
		key: 'last year',
		label: 'Last_year' as TranslationKey,
		range: lastNDays(365),
	},
] as const;

export type Period = (typeof periods)[number];

export const getPeriod = (key: (typeof periods)[number]['key']): Period => {
	const period = periods.find((period) => period.key === key);

	if (!period) {
		throw new Error(`"${key}" is not a valid period key`);
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
		throw new Error(`"${key}" is not a valid period key`);
	}

	return period.range(utc);
};
