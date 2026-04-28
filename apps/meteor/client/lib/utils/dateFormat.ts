import { format, formatDistanceToNow, formatDuration, intervalToDuration, differenceInCalendarDays } from 'date-fns';
import type { Locale } from 'date-fns';

export type DateInput = string | Date | number;

const FALLBACK_FORMAT = 'PPP p'; // date-fns equivalent of moment's LLL

/**
 * Translate a Moment.js format string to a date-fns format string.
 *
 * The two libraries diverge in two important ways that this function bridges:
 *  1. Moment treats unrecognized letters as literals (so `T` in `YYYY-MM-DDTHH:mm:ss`
 *     prints as a literal `T`); date-fns reserves every letter as a token, so an
 *     unmapped letter either produces wrong output (`T` = ms timestamp) or throws.
 *  2. Moment uses `Z`/`ZZ` for timezone offsets; date-fns has no `Z` token at all.
 *
 * The translator tokenizes left-to-right: it recognizes Moment's `[literal]` escape
 * syntax, longest-matches a known Moment token, and quotes any other letter as a
 * date-fns literal so admin-configured formats keep working after the moment→date-fns
 * migration. Used by Message_DateFormat / Message_TimeFormat / Message_TimeAndDateFormat.
 */
export const momentFormatToDateFns = (momentFormat: string): string => {
	const tokens: [moment: string, dateFns: string][] = [
		// Locale formats (longest first within each group)
		['LLLL', 'EEEE, PPP p'],
		['LTS', 'pp'],
		['LLL', 'PPP p'],
		['LL', 'PPP'],
		['LT', 'p'],
		['L', 'P'],
		// Year
		['YYYY', 'yyyy'],
		['YY', 'yy'],
		['Y', 'yyyy'],
		// Month
		['MMMM', 'MMMM'],
		['MMM', 'MMM'],
		['MM', 'MM'],
		['Mo', 'Mo'],
		['M', 'M'],
		// Day of month
		['Do', 'do'],
		['DD', 'dd'],
		['D', 'd'],
		// Day of week
		['dddd', 'EEEE'],
		['ddd', 'EEE'],
		['dd', 'EEEEEE'],
		// Hour
		['HH', 'HH'],
		['H', 'H'],
		['hh', 'hh'],
		['h', 'h'],
		// Minute
		['mm', 'mm'],
		['m', 'm'],
		// Second
		['ss', 'ss'],
		['s', 's'],
		// Fractional second
		['SSS', 'SSS'],
		['SS', 'SS'],
		['S', 'S'],
		// AM/PM
		['A', 'a'],
		['a', 'a'],
		// Timezone offset (Moment Z = +05:00, ZZ = +0500)
		['ZZ', 'xx'],
		['Z', 'xxx'],
		// Unix timestamp (Moment X = seconds, x = milliseconds)
		['X', 't'],
		['x', 'T'],
	];
	tokens.sort((a, b) => b[0].length - a[0].length);

	let out = '';
	let literal = '';
	let i = 0;

	const flushLiteral = () => {
		if (literal) {
			out += `'${literal.replace(/'/g, "''")}'`;
			literal = '';
		}
	};

	while (i < momentFormat.length) {
		const ch = momentFormat[i];

		if (ch === '[') {
			const end = momentFormat.indexOf(']', i + 1);
			if (end !== -1) {
				literal += momentFormat.slice(i + 1, end);
				i = end + 1;
				continue;
			}
		}

		let matched = false;
		for (const [mom, df] of tokens) {
			if (momentFormat.startsWith(mom, i)) {
				flushLiteral();
				out += df;
				i += mom.length;
				matched = true;
				break;
			}
		}
		if (matched) continue;

		if (/[a-zA-Z]/.test(ch)) {
			literal += ch;
		} else {
			flushLiteral();
			out += ch;
		}
		i++;
	}

	flushLiteral();
	return out;
};

const safeFormat = (d: Date, momentFormat: string, locale?: Locale): string => {
	try {
		return format(d, momentFormatToDateFns(momentFormat), locale ? { locale } : undefined);
	} catch {
		return format(d, FALLBACK_FORMAT, locale ? { locale } : undefined);
	}
};

export const formatDate = (date: DateInput, formatStr: string, locale?: Locale): string => {
	const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
	return safeFormat(d, formatStr, locale);
};

export const formatTimeAgo = (
	date: DateInput,
	options: {
		yesterdayLabel: string;
		sameDayFormat: string;
		lastDayFormat?: string; // if set, show "Yesterday" + format(time, lastDayFormat)
		lastWeekFormat: string;
		otherFormat: string;
		otherYearFormat: string;
	},
	locale?: Locale,
): string => {
	const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
	const now = new Date();
	const diffDays = differenceInCalendarDays(now, d);

	if (diffDays === 0) {
		return safeFormat(d, options.sameDayFormat, locale);
	}
	if (diffDays === 1) {
		if (options.lastDayFormat) {
			return `${options.yesterdayLabel} ${safeFormat(d, options.lastDayFormat, locale)}`;
		}
		return options.yesterdayLabel;
	}
	if (diffDays > 1 && diffDays < 7) {
		return safeFormat(d, options.lastWeekFormat, locale);
	}
	const diffYears = now.getFullYear() - d.getFullYear();
	const fmt = diffYears !== 0 ? options.otherYearFormat : options.otherFormat;
	return safeFormat(d, fmt, locale);
};

export const formatFromNow = (date: DateInput, addSuffix: boolean, locale?: Locale): string => {
	const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
	return formatDistanceToNow(d, { addSuffix, locale });
};

export const formatDurationMs = (timeMs: number, locale?: Locale): string => {
	const duration = intervalToDuration({ start: 0, end: timeMs });
	return formatDuration(duration, { locale });
};
