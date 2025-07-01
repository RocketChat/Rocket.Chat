import { timeAgo } from '@rocket.chat/gazzodown/src/elements/Timestamp/timeago';
import { format } from 'date-fns';

import { TIMESTAMP_FORMATS } from './formats';
import type { TimestampFormat, ITimestampValue } from './types';

/**
 * Converts a Date object to a Unix timestamp string
 */
export const dateToTimestamp = (date: Date): string => {
	return Math.floor(date.getTime() / 1000).toString();
};

/**
 * Converts a Unix timestamp string to a Date object
 */
export const timestampToDate = (timestamp: string): Date => {
	return new Date(parseInt(timestamp) * 1000);
};

/**
 * Formats a date according to the specified timestamp format
 */
export const formatTimestamp = (date: Date, formatType: TimestampFormat, locale: string): string => {
	const config = TIMESTAMP_FORMATS[formatType];

	if (formatType === 'R') {
		return formatRelativeTime(date, locale);
	}

	return format(date, config.format);
};

/**
 * Generates a timestamp markup string in the format <t:timestamp:format>
 */
export const generateTimestampMarkup = (timestamp: string, format: TimestampFormat): string => {
	return `<t:${timestamp}:${format}>`;
};

/**
 * Parses a timestamp markup string into a TimestampValue object
 */
export const parseTimestampMarkup = (markup: string): ITimestampValue | null => {
	const match = markup.match(/<t:(\d+):?([tTdDfFR])?>/);
	if (!match) {
		return null;
	}

	return {
		timestamp: match[1],
		format: (match[2] || 't') as TimestampFormat,
	};
};

/**
 * Formats a date as a relative time string
 */
const formatRelativeTime = (date: Date, locale: string): string => {
	return timeAgo(date.getTime(), locale);
};
