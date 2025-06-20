/**
 * Returns a localized string representing the relative time between the given date and now
 * @param dateParam - The date to compare (Date object, timestamp, or ISO string)
 * @param locale - The locale to use for formatting (e.g., 'en-US', 'pt-BR')
 * @param fallbackValue - The value returned in cases the provided date is invalid
 * @returns A localized string describing the time difference
 */
export function relativeTime(dateParam: Date | string | number, locale: string, fallbackValue = ''): string {
	const formatter = new Intl.RelativeTimeFormat(locale, { style: 'long' });
	const now = new Date();
	const then = new Date(dateParam);

	if (isNaN(then.getTime())) {
		return fallbackValue;
	}

	const seconds = Math.round((then - now) / 1000);
	const minutes = Math.round(seconds / 60);
	const hours = Math.round(minutes / 60);
	const days = Math.round(hours / 24);
	const weeks = Math.round(days / 7);
	const months = (then.getFullYear() - now.getFullYear()) * 12 + (then.getMonth() - now.getMonth());
	const years = then.getFullYear() - now.getFullYear();

	if (Math.abs(seconds) < 60) {
		return formatter.format(seconds, 'seconds');
	}

	if (Math.abs(minutes) < 60) {
		return formatter.format(minutes, 'minutes');
	}

	if (Math.abs(hours) < 24) {
		return formatter.format(hours, 'hours');
	}

	if (Math.abs(days) < 7) {
		return formatter.format(days, 'days');
	}

	if (Math.abs(weeks) < 4) {
		return formatter.format(weeks, 'weeks');
	}

	if (Math.abs(months) < 12) {
		return formatter.format(months, 'months');
	}

	return formatter.format(years, 'years');
}
