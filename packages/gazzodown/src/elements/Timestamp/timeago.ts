export function timeAgo(dateParam: number, locale: string): string {
	const int = new Intl.RelativeTimeFormat(locale, { style: 'long' });

	const date = new Date(dateParam).getTime();
	const today = new Date().getTime();
	const seconds = Math.round((date - today) / 1000);
	const minutes = Math.round(seconds / 60);
	const hours = Math.round(minutes / 60);
	const days = Math.round(hours / 24);
	const weeks = Math.round(days / 7);

	const months = new Date(date).getMonth() - new Date().getMonth();

	const years = new Date(date).getFullYear() - new Date().getFullYear();

	if (Math.abs(seconds) < 60) {
		return int.format(seconds, 'seconds');
	}

	if (Math.abs(minutes) < 60) {
		return int.format(minutes, 'minutes');
	}

	if (Math.abs(hours) < 24) {
		return int.format(hours, 'hours');
	}

	if (Math.abs(days) < 7) {
		return int.format(days, 'days');
	}

	if (Math.abs(weeks) < 4) {
		return int.format(weeks, 'weeks');
	}

	if (Math.abs(months) < 12) {
		return int.format(months, 'months');
	}

	return int.format(years, 'years');
}
