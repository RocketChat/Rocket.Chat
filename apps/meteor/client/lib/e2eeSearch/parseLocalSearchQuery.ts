export type LocalSearchQuery = {
	/** The words to find, without the filters. */
	text: string;
	/** Lowercase usernames of `from:` filters, without the `from:me` alias. */
	usernames: string[];
	/** The text has `from:me` (in lowercase only, as the server reads it): the logged-in user, which the caller resolves. */
	fromSelf?: true;
	/** Earliest message time in ms, inclusive. */
	from?: number;
	/** Latest message time in ms, inclusive. */
	to?: number;
};

// Day-month-year, the only date format of the server message search.
const DATE = String.raw`(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})`;

type DateParts = [string, string, string];

type LocalSearchQueryOptions = {
	/** The `utcOffset` of the user, in hours, as the server message search reads it from the user. */
	utcOffset?: number;
};

/**
 * The start of a day in the user's time zone, as the server message search computes it. `utcOffset` is in hours and is
 * positive east of UTC, so a user at UTC-3 starts the day at 03:00 UTC.
 */
const startOfDay = ([day, month, year]: DateParts, utcOffset: number, addDays = 0) =>
	Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10) + addDays) - utcOffset * 60 * 60 * 1000;

/**
 * Reads the filters of the server message search (`from:`, `before:`, `after:`, `on:`) from a local search text, with
 * the same words, date format (day-month-year) and day boundaries as the server, so a date filter finds the same
 * messages in an encrypted room as in other rooms. The local index then applies them, and the query stays on the
 * device. The last `before:` and the last `after:` win, and an `on:` replaces both.
 */
export const parseLocalSearchQuery = (searchText: string, { utcOffset = 0 }: LocalSearchQueryOptions = {}): LocalSearchQuery => {
	const usernames: string[] = [];
	let fromSelf = false;
	let from: number | undefined;
	let to: number | undefined;

	const text = searchText
		.replace(/from:([a-z0-9.\-_]+)/gi, (_, username: string) => {
			// The server resolves only a lowercase `me` to the user. `from:Me` is a filter on a user named so.
			if (username === 'me') {
				fromSelf = true;
				return '';
			}
			const name = username.toLowerCase();
			if (!usernames.includes(name)) usernames.push(name);
			return '';
		})
		.replace(new RegExp(`before:${DATE}`, 'g'), (_, ...parts: DateParts) => {
			to = startOfDay(parts, utcOffset);
			return '';
		})
		.replace(new RegExp(`after:${DATE}`, 'g'), (_, ...parts: DateParts) => {
			from = startOfDay(parts, utcOffset, 1);
			return '';
		})
		.replace(new RegExp(`on:${DATE}`, 'g'), (_, ...parts: DateParts) => {
			from = startOfDay(parts, utcOffset);
			to = startOfDay(parts, utcOffset, 1) - 1;
			return '';
		})
		.replace(/\s+/g, ' ')
		.trim();

	return {
		text,
		usernames,
		...(fromSelf ? { fromSelf: true as const } : {}),
		...(from !== undefined && { from }),
		...(to !== undefined && { to }),
	};
};
