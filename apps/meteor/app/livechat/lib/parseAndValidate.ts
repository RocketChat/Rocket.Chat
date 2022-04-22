import { typedJsonParse } from '../../../lib/typedJSONParse';

type DateParam = { start?: string; end?: string };
const parseDateParams = (date?: string): DateParam => {
	return date && typeof date === 'string' ? typedJsonParse<DateParam>(date) : {};
};
const validateDateParams = (property: string, date: DateParam = {}): DateParam => {
	if (date?.start && isNaN(Date.parse(date.start))) {
		throw new Error(`The "${property}.start" query parameter must be a valid date.`);
	}
	if (date?.end && isNaN(Date.parse(date.end))) {
		throw new Error(`The "${property}.end" query parameter must be a valid date.`);
	}
	return date;
};

export const parseAndValidate = (property: string, date?: string): DateParam => {
	return validateDateParams(property, parseDateParams(date));
};
