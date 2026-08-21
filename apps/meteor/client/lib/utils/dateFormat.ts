import { format, formatDistanceToNow, formatDuration, intervalToDuration, differenceInCalendarDays, parse } from 'date-fns';
import type { Locale } from 'date-fns';

export type DateInput = string | Date | number;

const FALLBACK_FORMAT = 'PPP p'; // date-fns equivalent of moment's LLL

const MOMENT_TO_DATE_FNS_TOKENS: ReadonlyArray<readonly [moment: string, dateFns: string]> = (
	[
		// Locale formats
		['LLLL', 'EEEE, PPP p'],
		['LTS', 'pp'],
		['LLL', 'PPP p'],
		['LL', 'PPP'],
		['LT', 'p'],
		['L', 'P'],
		// Locale formats — short variants (Moment lowercase l = no zero-padding;
		// date-fns has no equivalent without zero-padding, so PP/P is the closest match)
		['llll', 'EEE, PP p'],
		['lll', 'PP p'],
		['ll', 'PP'],
		['l', 'P'],
		// Year
		['YYYYYY', 'yyyyyy'], // 6-digit padded; Moment includes a +/- sign that date-fns omits
		['YYYY', 'yyyy'],
		['YY', 'yy'],
		['Y', 'yyyy'],
		['y', 'y'], // Moment lowercase y = era year (always positive); equivalent to calendar year for AD dates
		// Era — Moment N/NN/NNN are abbreviated, NNNN wide, NNNNN narrow
		['NNNNN', 'GGGGG'],
		['NNNN', 'GGGG'],
		['NNN', 'GGG'],
		['NN', 'GG'],
		['N', 'G'],
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
		// Day of year — needs `useAdditionalDayOfYearTokens` on date-fns
		['DDDD', 'DDD'],
		['DDDo', 'Do'],
		['DDD', 'D'],
		// Day of week
		['dddd', 'EEEE'],
		['ddd', 'EEE'],
		['dd', 'EEEEEE'],
		// Numeric day of week — semantics shift: Moment d/e produce 0-6 (Sun=0),
		// date-fns i/c produce 1-7. No exact equivalent exists.
		['do', 'io'],
		['d', 'i'],
		['e', 'c'],
		// ISO week of year
		['WW', 'II'],
		['Wo', 'Io'],
		['W', 'I'],
		// Week-numbering year — Moment gg/gggg = locale, GG/GGGG = ISO.
		// date-fns Y/YY/YYYY (locale) requires `useAdditionalWeekYearTokens`.
		['gggg', 'YYYY'],
		['gg', 'YY'],
		['GGGG', 'RRRR'],
		['GG', 'RR'],
		// Hour (H = 0-23, h = 1-12, k = 1-24)
		['HH', 'HH'],
		['H', 'H'],
		['hh', 'hh'],
		['h', 'h'],
		['kk', 'kk'],
		['k', 'k'],
		// Minute
		['mm', 'mm'],
		['m', 'm'],
		// Second
		['ss', 'ss'],
		['s', 's'],
		// Fractional second — JS Date only has ms precision; SSSS+ pad with zeros in both
		['SSSSSSSSS', 'SSSSSSSSS'],
		['SSSSSSSS', 'SSSSSSSS'],
		['SSSSSSS', 'SSSSSSS'],
		['SSSSSS', 'SSSSSS'],
		['SSSSS', 'SSSSS'],
		['SSSS', 'SSSS'],
		['SSS', 'SSS'],
		['SS', 'SS'],
		['S', 'S'],
		// AM/PM — date-fns `a`/`aa` are always uppercase (AM/PM); `aaa` is lowercase (am/pm)
		['A', 'a'],
		['a', 'aaa'],
		// Quarter
		['QQQQ', 'QQQQ'],
		['QQQ', 'QQQ'],
		['QQ', 'QQ'],
		['Qo', 'Qo'],
		['Q', 'Q'],
		// Week of year (locale)
		['ww', 'ww'],
		['wo', 'wo'],
		['w', 'w'],
		// ISO day of week (Moment E = 1-7 → date-fns i)
		['E', 'i'],
		// Timezone offset (Moment Z = +05:00, ZZ = +0500)
		['ZZ', 'xx'],
		['Z', 'xxx'],
		// Timezone abbreviated name (Moment z/zz = "EST"). date-fns has no
		// real abbreviation; zzz produces "GMT-3" in browsers. Closest available.
		['zz', 'zzz'],
		['z', 'zzz'],
		// Unix timestamp (Moment X = seconds, x = milliseconds)
		['X', 't'],
		['x', 'T'],
	] as Array<[moment: string, dateFns: string]>
).sort((a, b) => b[0].length - a[0].length);

const LITERAL_LETTER = /[a-zA-Z]/;

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
		for (const [mom, df] of MOMENT_TO_DATE_FNS_TOKENS) {
			if (momentFormat.startsWith(mom, i)) {
				flushLiteral();
				out += df;
				i += mom.length;
				matched = true;
				break;
			}
		}
		if (matched) continue;

		if (LITERAL_LETTER.test(ch)) {
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

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalize a date input to a Date.
 *
 * Calendar-date-only strings (`yyyy-MM-dd`, e.g. produced by an `<input type="date">`)
 * are parsed in LOCAL time, the way Moment.js did before the date-fns migration.
 * `new Date('2026-07-02')` instead parses as UTC midnight, which renders as the
 * previous day in negative-offset timezones (e.g. UTC-3 shows "Jul 1"). Full ISO
 * datetimes, numbers and Date objects keep their original instant semantics.
 */
export const toDate = (date: DateInput): Date => {
	if (date instanceof Date) {
		return date;
	}
	if (typeof date === 'string' && DATE_ONLY_RE.test(date)) {
		return parse(date, 'yyyy-MM-dd', new Date());
	}
	return new Date(date);
};

const safeFormat = (d: Date, momentFormat: string, locale?: Locale): string => {
	const options = {
		...(locale && { locale }),
		useAdditionalWeekYearTokens: true,
		useAdditionalDayOfYearTokens: true,
	};
	try {
		return format(d, momentFormatToDateFns(momentFormat), options);
	} catch {
		return format(d, FALLBACK_FORMAT, options);
	}
};

export const formatDate = (date: DateInput, formatStr: string, locale?: Locale): string => {
	return safeFormat(toDate(date), formatStr, locale);
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
	const d = toDate(date);
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
	return formatDistanceToNow(toDate(date), { addSuffix, locale });
};

export const formatDurationMs = (timeMs: number, locale?: Locale): string => {
	const duration = intervalToDuration({ start: 0, end: timeMs });
	return formatDuration(duration, { locale });
};
