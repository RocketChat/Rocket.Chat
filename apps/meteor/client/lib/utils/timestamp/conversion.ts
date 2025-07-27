import moment from 'moment-timezone';

import type { TimestampFormat } from './types';

export const dateToTimestamp = (date: Date, timezone?: string): string => {
	if (timezone && timezone !== 'UTC') {
		const momentDate = moment.tz(
			[date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()],
			timezone,
		);
		return momentDate.toISOString(true);
	}

	return date.toISOString().replace('Z', '+00:00');
};

/**
 * Generates a timestamp markup string in the format <t:timestamp:format>
 */
export const generateTimestampMarkup = (timestamp: string, format: TimestampFormat): string => {
	return `<t:${timestamp}:${format}>`;
};
