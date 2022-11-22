import moment from 'moment';

export const getDateRange = (): {
	start: string;
	end: string;
} => {
	const today = moment(new Date());
	const start = moment(new Date(today.year(), today.month(), today.date(), 0, 0, 0));
	const end = moment(new Date(today.year(), today.month(), today.date(), 23, 59, 59));

	return {
		start: start.toISOString(),
		end: end.toISOString(),
	};
};
