import { UTCOffsets, type TimestampFormat, type TimezoneKey } from './types';

export const dateToISOString = (date: Date, timezone?: TimezoneKey): string => {
	if (!date || isNaN(date.getTime())) {
		return '';
	}

	if (timezone && timezone !== 'local') {
		const offset = UTCOffsets[timezone];
		if (offset) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			const seconds = String(date.getSeconds()).padStart(2, '0');
			const ms = String(date.getMilliseconds()).padStart(3, '0');
			return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${offset}`;
		}
	}

	return date.toISOString().replace('Z', '+00:00');
};

/**
 * Generates a timestamp markup string in the format <t:timestamp:format>
 */
export const generateTimestampMarkup = (timestamp: string, format: TimestampFormat): string => {
	return `<t:${timestamp}:${format}>`;
};
