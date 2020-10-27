import moment from 'moment';
import 'moment-timezone';

export const getDate = () => moment();

export const setDate = (unit, value) => {
	console.log('setDate call');
	return moment.set(unit, value);
};

export const getDateWithFormat = (format) => {
	console.log('getDateWithFormat');
	return getDate().format(format);
};

export const getDateWithUTC = (utc) => {
	console.log('getDateWithUTC call');
	return getDate().utc(utc);
};

export const utcOffsetDate = (value) => {
	console.log('utcOffsetDate call');
	if (!value) {
		getDate().utcOffset();
	} else {
		getDate().utcOffset(value);
	}
};

export const getDateDiff = (a, b) => {
	console.log('getDateDiff call');
	return getDate().diff(a, b);
};

export const getDateStart = (value) => {
	console.log('getDateStart call');
	return getDate().startOf(value);
};

export const getDateEnd = (value) => {
	console.log('getDateEnd call');
	return getDate().endOf(value);
};

export const checkDateIsValid = () => {
	console.log('checkDateIsValid call');
	getDate().isValid();
};

export const checkDateIsSame = (value) => {
	console.log('checkDateIsSame call');
	return getDate().isSame(value);
};

export const checkDateIsAfter = (value) => {
	console.log('checkDateIsAfter call');
	return getDate().isAfter(value);
};

export const checkDateIsSameOrAfter = (value) => {
	console.log('checkDateIsSameOrAfter call');
	return getDate().isSameOrAfter(value);
};

export const addDate = (value, text) => {
	console.log('addDate call');
	return getDate().add(value, text);
};

export const subtractDate = (value, text) => {
	console.log('subtractDate call');
	return getDate().subtract(value, text);
};

export const setRelativeTimeThreshold = (unit, limit) => {
	console.log('setRelativeTimeThreshold call');
	return getDate().relativeTimeThreshold(unit, limit);
};

export const humanizeDate = (current) => {
	console.log('humanizeDate call');
	return current.humanize();
};

export const getDateCalendar = (referenceDay, formats) => {
	console.log('getDateCalendar call');
	if (referenceDay !== null) {
		return getDate().calendar(referenceDay);
	}
	return getDate().calendar(null, formats);
};

export const localeDate = (value) => {
	console.log('localeDate call');
	if (value) {
		return getDate().locale(value);
	}
	return getDate().locale();
};

export const getNativeDate = () => {
	console.log('getNativeDate call');
	return getDate().toDate();
};

export const durationDate = (num, string) => {
	console.log('durationDate call');
	return moment.duration(num, string);
};

export const getDateFromNow = () => {
	console.log('getDateFromNow call');
	return getDate().fromNow();
};

export const toISODate = () => {
	console.log('toISODate call');
	return getDate().toISOString();
};

export const cloneDate = () => {
	console.log('cloneDate call');
	return getDate().duration().clone();
	// return getDate().clone();
};

// moment().tz(user.timezone).format('Z').toString()
// TZ is timeZone???
// tz().guess ???
// tz().names

// Playground
console.log(checkDateIsSame(new Date()));
console.log(getDateDiff(subtractDate(1, 'days'), new Date()));
console.log(humanizeDate(durationDate(100)));
