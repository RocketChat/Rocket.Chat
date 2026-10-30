export type LocalSearchQuery = {
	text: string;
	usernames: string[];
	fromSelf?: true;
	from?: number;
	to?: number;
};

const DATE = String.raw`(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})`;

type DateParts = [string, string, string];

type LocalSearchQueryOptions = {
	utcOffset?: number;
};

const startOfDay = ([day, month, year]: DateParts, utcOffset: number, addDays = 0) =>
	Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10) + addDays) - utcOffset * 60 * 60 * 1000;

/** Extract author and day-month-year filters without sending the query to a server. */
export const parseLocalSearchQuery = (searchText: string, { utcOffset = 0 }: LocalSearchQueryOptions = {}): LocalSearchQuery => {
	if (!Number.isFinite(utcOffset)) throw new RangeError('Invalid UTC offset');
	const usernames: string[] = [];
	let fromSelf = false;
	let from: number | undefined;
	let to: number | undefined;

	const text = searchText
		.replace(/from:([a-z0-9.\-_]+)/gi, (_, username: string) => {
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
