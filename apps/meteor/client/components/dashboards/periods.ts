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

export const getClosedPeriod =
	(
		startOf: 'year' | 'month' | 'week',
		subtract = 0,
	): ((utc: boolean) => {
		start: Date;
		end: Date;
	}) =>
	(utc): { start: Date; end: Date } => {
		const date = new Date();
		const offsetForMoment = -(date.getTimezoneOffset() / 60);
		let start = moment(date).utc();
		let end = moment(date).utc();

		start.subtract(subtract, 'months');

		if (!utc) {
			start = start.utcOffset(offsetForMoment);
			end = end.utcOffset(offsetForMoment);
		}

		// moment.toDate() can only return the date in localtime, that's why we do the new Date conversion
		// https://github.com/moment/moment-timezone/issues/644
		return {
			start: new Date(start.startOf(startOf).format('YYYY-MM-DD HH:mm:ss')),
			end: new Date(end.endOf('day').format('YYYY-MM-DD HH:mm:ss')),
		};
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
		range: getClosedPeriod('week'),
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
		range: getClosedPeriod('month'),
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
		range: getClosedPeriod('month', 6),
	},
	{
		key: 'this year',
		label: label('This_year'),
		range: getClosedPeriod('year'),
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
