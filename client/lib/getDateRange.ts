import { getDate, toISODate } from '../../lib/rocketchat-dates';

export const getDateRange = (): {
	start: string;
	end: string;
} => {
	const today = getDate(new Date());
	const start = getDate(new Date(today.year(), today.month(), today.date(), 0, 0, 0));
	const end = getDate(new Date(today.year(), today.month(), today.date(), 23, 59, 59));

	return {
		start: toISODate(start),
		end: toISODate(end),
	};
};
