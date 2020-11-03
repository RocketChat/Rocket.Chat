import moment from 'moment';
import 'moment-timezone';

export const getDateInstance = (value) => {
	if (value) {
		moment.value;
	}
	return moment;
};

export const getDate = (date, format) => moment(date && date, format && format);

export const setDate = (obj, unit, value) => {
	console.log('setDate call');
	return obj.set(unit, value);
};

export const getDateWithFormat = (obj, format) => {
	console.log('getDateWithFormat');
	return obj.format(format);
};

export const getDateWithUTC = (obj, utc) => {
	console.log('getDateWithUTC call');
	return obj.utc(utc && utc);
};

export const dateWithUTC = (value) => {
	console.log('dateWithUTC call');
	return moment.utc(value && value);
};

export const utcOffsetDate = (obj, value) => {
	console.log('utcOffsetDate call');
	return obj.utcOffset(value && value);
};

export const getDateDiff = (obj, moment, unit) => {
	console.log('getDateDiff call');
	return obj.diff(moment && moment, unit && unit);
};

export const getDateStart = (obj, unit) => {
	console.log('getDateStart call');
	return obj.startOf(unit);
};

export const getDateEnd = (obj, value) => {
	console.log('getDateEnd call');
	return obj.endOf(value);
};

export const checkDateIsValid = (obj) => {
	console.log('checkDateIsValid call');
	return obj.isValid();
};

export const checkDateIsSame = (obj, value) => {
	console.log('checkDateIsSame call');
	return obj.isSame(value);
};

export const checkDateIsBefore = (obj, value) => {
	console.log('checkDateIsBefore call');
	return obj.isBefore(value);
};

export const checkDateIsAfter = (obj, value) => {
	console.log('checkDateIsAfter call');
	return obj.isAfter(value);
};

export const checkDateIsSameOrAfter = (obj, value) => {
	console.log('checkDateIsSameOrAfter call');
	return obj.isSameOrAfter(value);
};

export const checkDateIsSameOrBefore = (obj, value) => {
	console.log('checkDateIsSameOrBefore call');
	return obj.isSameOrBefore(value);
};

export const addDate = (obj, value, text) => {
	console.log('addDate call');
	return obj.add(value, text);
};

export const subtractDate = (obj, value, text) => {
	console.log('subtractDate call');
	return obj.subtract(value, text);
};

export const relativeTimeThreshold = (unit, limit) => {
	console.log('relativeTimeThreshold call');
	return moment.relativeTimeThreshold(unit, limit && limit);
};

export const humanizeDate = (obj) => {
	console.log('humanizeDate call');
	return obj.humanize();
};

export const getDateCalendar = (obj, referenceDay, formats) => {
	console.log('getDateCalendar call');
	return obj.calendar(referenceDay, formats);
};

export const localeDate = (obj, value) => {
	console.log('localeDate call');
	return obj.locale(value && value);
};

export const getNativeDate = (obj) => {
	console.log('getNativeDate call');
	return obj.toDate();
};

export const durationDate = (num, string) => {
	console.log('durationDate call');
	return moment.duration(num, string);
};

export const getDateFromNow = (obj, value) => {
	console.log('getDateFromNow call');
	return obj.fromNow(value && value);
};

export const toISODate = (obj) => {
	console.log('toISODate call');
	return obj.toISOString();
};

export const cloneDate = (obj) => {
	console.log('cloneDate call');
	return obj.clone();
};

export const timeZoneDate = (obj, value) => {
	console.log('timeZoneDate call');
	return obj.tz(value && value);
};

export const getTimeZoneDate = (time, format, name) => {
	console.log('getTimeZoneDate call');
	return moment.tz(time && time, format && format, name && name);
};

export const guessTimeZoneDate = () => {
	console.log('guessTimeZoneDate call');
	return moment.tz.guess();
};

export const namesTimeZoneDate = () => {
	console.log('guessTimeZoneDate call');
	return moment.tz.names();
};

export const getDateDayOfWeek = (date) => {
	console.log('getDateDayOfWeek call');
	return date.day();
};

export const getDateDay = (date) => {
	console.log('getDateDay call');
	return date.date();
};

export const getDateMonth = (date) => {
	console.log('getDateMonth call');
	return date.month();
};

export const getDateYear = (date) => {
	console.log('getDateYear call');
	return date.year();
};

export const getPeriod = (periodId) => {
	switch (periodId) {
		case 'last 7 days':
			return {
				start: subtractDate(setDate(getDate(), { hour: 0, minute: 0, second: 0, millisecond: 0 }), 7, 'days'),
				end: subtractDate(setDate(getDate(), { hour: 0, minute: 0, second: 0, millisecond: 0 }), 1),
			};

		case 'last 30 days':
			return {
				start: subtractDate(setDate(getDate(), { hour: 0, minute: 0, second: 0, millisecond: 0 }), 30, 'days'),
				end: subtractDate(setDate(getDate(), { hour: 0, minute: 0, second: 0, millisecond: 0 }), 1),
			};

		case 'last 90 days':
			return {
				start: subtractDate(setDate(getDate(), { hour: 0, minute: 0, second: 0, millisecond: 0 }), 90, 'days'),
				end: subtractDate(setDate(getDate(), { hour: 0, minute: 0, second: 0, millisecond: 0 }), 1),
			};
	}
};
