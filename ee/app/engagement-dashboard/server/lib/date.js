import moment from 'moment';

export const convertDateToInt = (date) => parseInt(moment(date).clone().format('YYYYMMDD'));
export const convertIntToDate = (intValue) => moment(intValue, 'YYYYMMDD').clone().toDate();
export const diffBetweenDays = (start, end) => moment(new Date(start)).clone().diff(new Date(end), 'days');
export const diffBetweenDaysInclusive = (start, end) => diffBetweenDays(start, end) + 1;

export const getTotalOfWeekItems = (weekItems, property) => weekItems.reduce((acc, item) => {
	acc += item[property];
	return acc;
}, 0);
