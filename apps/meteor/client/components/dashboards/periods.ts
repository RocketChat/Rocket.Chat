import type { TranslationKey } from '@rocket.chat/ui-contexts';
import moment from 'moment';

const label = (translationKey: TranslationKey): readonly [translationKey: TranslationKey] => [translationKey];

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

const getLast6Months = () => {
	const last6Months = moment().subtract(6, 'months');
	return moment().diff(last6Months, 'days');
};

const periods = [
	{
		key: 'today',
		label: label('Today'),
		range: lastNDays(0),
	},
	{
		key: 'this week',
		label: label('This_week'),
		range: lastNDays(moment().day()),
	},
	{
		key: 'last 7 days',
		label: label('Last_7_days'),
		range: lastNDays(7),
	},
	{
		key: 'last 15 days',
		label: label('Last_15_days'),
		range: lastNDays(15),
	},
	{
		key: 'this month',
		label: label('This_month'),
		range: lastNDays(moment().date()),
	},
	{
		key: 'last 30 days',
		label: label('Last_30_days'),
		range: lastNDays(30),
	},
	{
		key: 'last 90 days',
		label: label('Last_90_days'),
		range: lastNDays(90),
	},
	{
		key: 'last 6 months',
		label: label('Last_6_months'),
		range: lastNDays(getLast6Months()),
	},
	{
		key: 'this year',
		label: label('This_year'),
		range: lastNDays(moment().dayOfYear()),
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
