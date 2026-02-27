import { format, formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';
import type { Locale } from 'date-fns';

export type DateInput = string | Date | number;

/**
 * Map moment-style locale format tokens to date-fns format string.
 * Used for Message_DateFormat and Message_TimeFormat settings (defaults: LL, LT).
 */
export const momentFormatToDateFns = (momentFormat: string): string => {
	const tokenMap: Record<string, string> = {
		L: 'P', // 09/04/1986
		LT: 'p', // 8:30 PM
		LTS: 'pp', // 8:30:00 PM
		LL: 'PPP', // September 4, 1986
		LLL: 'PPP p', // September 4, 1986 8:30 PM
		LLLL: 'EEEE, PPP p',
		// Common tokens
		YYYY: 'yyyy',
		YY: 'yy',
		MMMM: 'MMMM',
		MMM: 'MMM',
		MM: 'MM',
		M: 'M',
		Do: 'do', // 4th
		DD: 'dd',
		D: 'd',
		dddd: 'EEEE',
		ddd: 'EEE',
		HH: 'HH',
		H: 'H',
		hh: 'hh',
		h: 'h',
		mm: 'mm',
		m: 'm',
		ss: 'ss',
		s: 's',
		A: 'a',
		a: 'a',
	};
	let out = momentFormat;
	const entries = Object.entries(tokenMap).sort(([a], [b]) => b.length - a.length);
	for (const [mom, df] of entries) {
		out = out.replace(new RegExp(mom.replace(/([.*+?^${}()|[\]\\])/g, '\\$1'), 'g'), df);
	}
	return out;
};

export const formatDate = (date: DateInput, formatStr: string, locale?: Locale): string => {
	const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
	const dfFormat = momentFormatToDateFns(formatStr);
	return format(d, dfFormat, locale ? { locale } : undefined);
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
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		return format(d, momentFormatToDateFns(options.sameDayFormat), locale ? { locale } : undefined);
	}
	if (diffDays === 1) {
		if (options.lastDayFormat) {
			return `${options.yesterdayLabel} ${format(d, momentFormatToDateFns(options.lastDayFormat), locale ? { locale } : undefined)}`;
		}
		return options.yesterdayLabel;
	}
	if (diffDays < 7) {
		return format(d, momentFormatToDateFns(options.lastWeekFormat), locale ? { locale } : undefined);
	}
	const diffYears = now.getFullYear() - d.getFullYear();
	const fmt = diffYears !== 0 ? options.otherYearFormat : options.otherFormat;
	return format(d, momentFormatToDateFns(fmt), locale ? { locale } : undefined);
};

export const formatFromNow = (date: DateInput, addSuffix: boolean, locale?: Locale): string => {
	const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
	return formatDistanceToNow(d, { addSuffix, locale });
};

export const formatDurationMs = (timeMs: number, locale?: Locale): string => {
	const duration = intervalToDuration({ start: 0, end: timeMs });
	return formatDuration(duration, { locale });
};
