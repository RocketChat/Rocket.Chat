import mem from 'mem';
import moment from 'moment';

export const isDateISOString = mem(
	(input: string): input is string => {
		const timestamp = Date.parse(input);
		return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === input;
	},
	{ maxAge: 10000 },
);

export const mapDateForAPI = (input: string): Date => {
	if (!isDateISOString(input)) {
		throw new Error('invalid ISO 8601 date');
	}

	return new Date(Date.parse(input));
};

export const convertDateToInt = (date: Date): number => parseInt(moment(date).clone().format('YYYYMMDD'), 10);
export const convertIntToDate = (intValue: number): Date => moment(intValue, 'YYYYMMDD').clone().toDate();
export const diffBetweenDays = (start: string | number | Date, end: string | number | Date): number =>
	moment(new Date(start)).clone().diff(new Date(end), 'days');
export const diffBetweenDaysInclusive = (start: string | number | Date, end: string | number | Date): number =>
	diffBetweenDays(start, end) + 1;

export const getTotalOfWeekItems = <T extends Record<string, number>>(weekItems: T[], property: keyof T): number =>
	weekItems.reduce((acc, item) => {
		acc += item[property];
		return acc;
	}, 0);

export function transformDatesForAPI(start: string): { start: Date; end: undefined };
export function transformDatesForAPI(start: string, end: string): { start: Date; end: Date };
export function transformDatesForAPI(start: string, end?: string): { start: Date; end: Date | undefined } {
	return {
		start: mapDateForAPI(start),
		end: end ? mapDateForAPI(end) : undefined,
	};
}
