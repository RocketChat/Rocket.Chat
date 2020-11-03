import { cloneDate, getDateWithFormat, getDate, getNativeDate, getDateDiff } from '../../../../../lib/rocketchat-dates';

export const convertDateToInt = (date) => parseInt(getDateWithFormat(cloneDate(getDate(date)), 'YYYYMMDD'));
export const convertIntToDate = (intValue) => getNativeDate(cloneDate(getDate(intValue, 'YYYYMMDD')));
export const diffBetweenDays = (start, end) => getDateDiff(cloneDate(getDate(new Date(start))), new Date(end), 'days');
export const diffBetweenDaysInclusive = (start, end) => diffBetweenDays(start, end) + 1;

export const getTotalOfWeekItems = (weekItems, property) => weekItems.reduce((acc, item) => {
	acc += item[property];
	return acc;
}, 0);
