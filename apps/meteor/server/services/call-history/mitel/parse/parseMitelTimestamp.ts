import { logger } from '../../logger';

// in theory the length from Mitel timestamps is always 25, but as long as we get a date and time, we can make it work
// This sets the minimum length we'll try to parse
const minValidLength = 16;

/**
 * Mitel timestamps use the following format: `YYYY-MM-DD HH:mm:ss (UTC)`
 * This function will replace the timezone with an ISO-compatible format: `YYYY-MM-DD HH:mm:ssZ`
 *
 * The timezone label is not parsed - we assume it is always UTC as per the API specification
 */
export function fixMitelTimestamp(value: string): string {
	const dateTime = removeExtraText(value).trim();
	if (dateTime.length < minValidLength) {
		throw new Error('Invalid timestamp received');
	}

	return setDefaultTimezone(dateTime);
}

function removeExtraText(timestamp: string): string {
	// Remove the text representation of the timezone
	const textPosition = timestamp.indexOf('(');
	if (textPosition < minValidLength) {
		return timestamp;
	}

	return timestamp.substring(0, textPosition);
}

function setDefaultTimezone(dateTime: string): string {
	// If the timestamp doesn't end with a time value, or if it has a time offset, do not change the timezone
	if (!dateTime.match(/[\d:]+\s*$/) || dateTime.includes('Z') || dateTime.match(/:[^-+]*[-+]/)) {
		return dateTime;
	}

	// Append a 'Z' to the iso datetime so that it will be parsed as UTC instead of local time
	return `${dateTime}Z`;
}

export function parseMitelTimestamp(value: unknown): Date | null {
	if (!value || typeof value !== 'string') {
		return null;
	}

	try {
		const isoDateTime = fixMitelTimestamp(value);
		const parsed = new Date(isoDateTime);

		if (Number.isNaN(parsed.valueOf())) {
			throw new Error('Parsed value is not a valid date');
		}

		return parsed;
	} catch (err) {
		logger.warn({ msg: 'Failed to parse timestamp', value, err });
		return null;
	}
}
