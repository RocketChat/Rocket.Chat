import { addDays, addHours, addWeeks, startOfDay, differenceInDays, differenceInWeeks } from 'date-fns';
import { TZDate } from '@date-fns/tz';

const HOURS_IN_DAY = 24;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number) => String(n).padStart(2, '0');

export async function* dayIterator(from: Date, to: Date): AsyncGenerator<Date> {
	let current = startOfDay(from);
	const toStart = startOfDay(to);
	while (differenceInDays(toStart, current) >= 0) {
		yield current;
		current = addDays(current, 1);
	}
}

export async function* weekIterator(from: Date, to: Date, _timezone: string): AsyncGenerator<Date> {
	let current = new Date(from);
	while (current.getTime() <= to.getTime()) {
		yield new Date(current);
		current = addWeeks(current, 1);
	}
}

export async function* hourIterator(day: Date): AsyncGenerator<Date> {
	let current = startOfDay(day);
	let passedHours = 0;
	while (passedHours < HOURS_IN_DAY) {
		yield new Date(current);
		current = addHours(current, 1);
		passedHours++;
	}
}

/** Parse YYYY-MM-DD in timezone and return start/end of day as UTC Date */
export function parseRangeInTimezone(dateStr: string, timezone: string): { start: Date; end: Date } {
	const [y, m, d] = dateStr.split('-').map(Number);
	const startTz = new TZDate(y, m - 1, d, 0, 0, 0, 0, timezone);
	const endTz = new TZDate(y, m - 1, d, 23, 59, 59, 999, timezone);
	return { start: new Date(startTz.getTime()), end: new Date(endTz.getTime()) };
}

/** Format a UTC date in timezone */
export function formatInTimezone(utcDate: Date, timezone: string, fmt: string): string {
	const tzDate = new TZDate(utcDate.getTime(), timezone);
	const y = tzDate.getFullYear();
	const m = tzDate.getMonth();
	const d = tzDate.getDate();
	const h = tzDate.getHours();
	if (fmt === 'DD-MM-YYYY') return `${pad(d)}-${pad(m + 1)}-${y}`;
	if (fmt === 'H') return String(h);
	if (fmt === 'dddd') return DAY_NAMES[tzDate.getDay()];
	if (fmt === 'hA') return h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`;
	return '';
}

export function formatHourInTimezone(hour: number, timezone: string): string {
	const tzDate = new TZDate(2025, 0, 6, hour, 0, 0, 0, timezone);
	const h = tzDate.getHours();
	return h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`;
}
