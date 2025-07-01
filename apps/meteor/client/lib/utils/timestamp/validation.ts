import type { TimestampFormat } from './types';

/**
 * Validates if a string is a valid Unix timestamp
 */
export const isValidTimestamp = (timestamp: string): boolean => {
	const value = parseInt(timestamp);
	return !Number.isNaN(value) && value > 0;
};

/**
 * Validates if a string is a valid timestamp format
 */
export const isValidFormat = (format: string): format is TimestampFormat => {
	return ['t', 'T', 'd', 'D', 'f', 'F', 'R'].includes(format);
};

/**
 * Validates if a string is a valid timestamp markup
 */
export const isValidTimestampMarkup = (markup: string): boolean => {
	const regex = /<t:\d+(?::[tTdDfFR])?>/;
	return regex.test(markup);
};

/**
 * Validates if a date is within a reasonable range (e.g., not too far in the past or future)
 */
export const isValidDateRange = (date: Date): boolean => {
	const now = new Date();
	const minDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
	const maxDate = new Date(now.getFullYear() + 100, 11, 31); // 100 years in the future

	return date >= minDate && date <= maxDate;
};
