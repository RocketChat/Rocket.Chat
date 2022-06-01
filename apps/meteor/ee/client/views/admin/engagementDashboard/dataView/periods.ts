import { TranslationKey } from '@rocket.chat/ui-contexts';
import moment from 'moment';

const label = (
	translationKey: TranslationKey,
	...replacements: unknown[]
): readonly [translationKey: TranslationKey, ...replacements: unknown[]] => [translationKey, ...replacements];

const lastNDays =
	(
		n: number,
	): ((utc: boolean) => {
		start: Date;
		end: Date;
	}) =>
	(utc): { start: Date; end: Date } => ({
		start: utc
			? moment.utc().startOf('day').subtract(n, 'days').toDate()
			: moment()
					.startOf('day')
					.subtract(n + 1, 'days')
					.toDate(),
		end: utc ? moment.utc().endOf('day').subtract(1, 'days').toDate() : moment().endOf('day').toDate(),
	});

export const periods = [
	{
		key: 'last 7 days',
		label: label('Last_7_days'),
		range: lastNDays(7),
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
] as const;

export type Period = typeof periods[number];

export const getPeriod = (key: typeof periods[number]['key']): Period => {
	const period = periods.find((period) => period.key === key);

	if (!period) {
		throw new Error(`"${key}" is not a valid period key`);
	}

	return period;
};

export const getPeriodRange = (
	key: typeof periods[number]['key'],
	utc = false,
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
