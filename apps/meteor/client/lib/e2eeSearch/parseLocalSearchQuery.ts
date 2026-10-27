export type LocalSearchQuery = {
	/** The words to find, without the filters. */
	text: string;
	/** Lowercase usernames of `from:` filters. `me` stays `me`, the caller resolves it. */
	usernames: string[];
	/** Earliest message time in ms, inclusive. */
	from?: number;
	/** Latest message time in ms, inclusive. */
	to?: number;
};

// Day-month-year (the server search format), or year-month-day (ISO) when the first part has 4 digits.
const DATE = String.raw`(?:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})|(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2}))`;

type DateParts = [string | undefined, string | undefined, string | undefined, string | undefined, string | undefined, string | undefined];

// Midnight at the start of the day, in the time zone of this browser.
const startOfDay = ([day, month, year, isoYear, isoMonth, isoDay]: DateParts, addDays = 0) =>
	new Date(
		parseInt((year ?? isoYear) as string, 10),
		parseInt((month ?? isoMonth) as string, 10) - 1,
		parseInt((day ?? isoDay) as string, 10) + addDays,
	).getTime();

/**
 * Reads the filters of the server message search (`from:`, `before:`, `after:`, `on:`) from a local search text, with
 * the same words and date format (day-month-year), and also ISO dates (year-month-day). The local index then applies them, so the query stays on the device.
 * Dates use the time zone of this browser: `before:` and `on:` start at midnight of that day, `after:` starts at the
 * midnight after it.
 */
export const parseLocalSearchQuery = (searchText: string): LocalSearchQuery => {
	const usernames: string[] = [];
	let from: number | undefined;
	let to: number | undefined;

	const text = searchText
		.replace(/from:([a-z0-9.\-_]+)/gi, (_, username: string) => {
			const name = username.toLowerCase();
			if (!usernames.includes(name)) usernames.push(name);
			return '';
		})
		.replace(new RegExp(`before:${DATE}`, 'g'), (_, ...parts: DateParts) => {
			const time = startOfDay(parts);
			to = to === undefined ? time : Math.min(to, time);
			return '';
		})
		.replace(new RegExp(`after:${DATE}`, 'g'), (_, ...parts: DateParts) => {
			const time = startOfDay(parts, 1);
			from = from === undefined ? time : Math.max(from, time);
			return '';
		})
		.replace(new RegExp(`on:${DATE}`, 'g'), (_, ...parts: DateParts) => {
			from = startOfDay(parts);
			to = startOfDay(parts, 1) - 1;
			return '';
		})
		.replace(/\s+/g, ' ')
		.trim();

	return { text, usernames, ...(from !== undefined && { from }), ...(to !== undefined && { to }) };
};
