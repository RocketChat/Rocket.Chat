// A line-for-line port of `CronTime#sendAt` from cron@1.8.2, the version that schedules the server's jobs.
// Its quirks are kept on purpose (0-indexed months, day-of-month OR day-of-week, the DST nudges),
// so a date shown in the UI is the date the server will run.

type TimeUnit = 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

const TIME_UNITS: TimeUnit[] = ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];

const CONSTRAINTS: Record<TimeUnit, [number, number]> = {
	second: [0, 59],
	minute: [0, 59],
	hour: [0, 23],
	dayOfMonth: [1, 31],
	month: [0, 11],
	dayOfWeek: [0, 6],
};

const MONTH_CONSTRAINTS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const PARSE_DEFAULTS = ['0', '*', '*', '*', '*', '*'];

const ALIASES: Record<string, number> = {
	jan: 0,
	feb: 1,
	mar: 2,
	apr: 3,
	may: 4,
	jun: 5,
	jul: 6,
	aug: 7,
	sep: 8,
	oct: 9,
	nov: 10,
	dec: 11,
	sun: 0,
	mon: 1,
	tue: 2,
	wed: 3,
	thu: 4,
	fri: 5,
	sat: 6,
};

const SEARCH_TIMEOUT_MS = 5000;
const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

type CronFields = Record<TimeUnit, Set<number>>;

const parseField = (field: string, values: Set<number>, [low, high]: [number, number]) => {
	field.split(',').forEach((part) => {
		const wildcardIndex = part.indexOf('*');
		if (wildcardIndex !== -1 && wildcardIndex !== 0) {
			throw new Error(`Field (${part}) has an invalid wildcard expression`);
		}
	});

	const expanded = field.replace(/\*/g, `${low}-${high}`);

	for (const range of expanded.split(',')) {
		const match = /^(\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(range);
		if (!match) {
			throw new Error(`Field (${expanded}) cannot be parsed`);
		}

		const [, rawLower, rawUpper, rawStep] = match;
		let lower = parseInt(rawLower, 10);
		let upper: number | undefined = parseInt(rawUpper, 10) || undefined;

		const wasStepDefined = !isNaN(parseInt(rawStep, 10));
		if (rawStep === '0') {
			throw new Error(`Field (${expanded}) has a step of zero`);
		}
		const step = parseInt(rawStep, 10) || 1;

		if (upper && lower > upper) {
			throw new Error(`Field (${expanded}) has an invalid range`);
		}

		if (lower < low || (upper && upper > high) || (!upper && lower > high)) {
			throw new Error(`Field (${expanded}) value is out of range`);
		}

		lower = Math.min(Math.max(low, Math.trunc(Math.abs(lower))), high);

		if (upper) {
			upper = Math.min(high, Math.trunc(Math.abs(upper)));
		} else {
			upper = wasStepDefined ? high : lower;
		}

		let pointer = lower;
		do {
			values.add(pointer);
			pointer += step;
		} while (pointer <= upper);
	}
};

// Remaps days-of-month that no selected month can reach, so the search below cannot loop forever.
const verifyFields = (fields: CronFields) => {
	let ok = false;
	let lastWrongMonth = NaN;

	for (const month of [...fields.month].sort((a, b) => a - b)) {
		const maxDays = MONTH_CONSTRAINTS[month];
		for (const day of fields.dayOfMonth) {
			if (day <= maxDays) {
				ok = true;
			}
		}

		if (!ok) {
			lastWrongMonth = month;
		}
	}

	if (!ok) {
		const maxDays = MONTH_CONSTRAINTS[lastWrongMonth];
		for (const day of [...fields.dayOfMonth]) {
			if (day > maxDays) {
				fields.dayOfMonth.delete(day);
				fields.dayOfMonth.add(day % maxDays);
			}
		}
	}
};

const parseExpression = (expression: string): CronFields => {
	const source = expression.replace(/[a-z]{1,3}/gi, (alias) => {
		const value = ALIASES[alias.toLowerCase()];
		if (value === undefined) {
			throw new Error(`Unknown alias: ${alias.toLowerCase()}`);
		}
		return String(value);
	});

	const split = source.trim().split(/\s+/);

	if (split.length < TIME_UNITS.length - 1) {
		throw new Error('Too few fields');
	}
	if (split.length > TIME_UNITS.length) {
		throw new Error('Too many fields');
	}

	const fields = Object.fromEntries(TIME_UNITS.map((unit) => [unit, new Set<number>()])) as CronFields;

	TIME_UNITS.forEach((unit, i) => {
		const field = split[i - (TIME_UNITS.length - split.length)] || PARSE_DEFAULTS[i];
		parseField(field, fields[unit], CONSTRAINTS[unit]);
	});

	verifyFields(fields);

	return fields;
};

const isRestricted = (fields: CronFields, unit: TimeUnit) => {
	const [low, high] = CONSTRAINTS[unit];
	return fields[unit].size !== high - low + 1;
};

const addMonthClamped = (date: Date) => {
	const day = date.getDate();
	date.setDate(1);
	date.setMonth(date.getMonth() + 1);
	const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	date.setDate(Math.min(day, daysInMonth));
};

const findDST = (date: Date) => new Date(date.getTime() + ONE_SECOND_MS);

const resetTime = (date: Date) => {
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
};

const advanceToNextDay = (date: Date, prevDay: number) => {
	date.setDate(date.getDate() + 1);
	if (date.getDay() === prevDay) {
		date.setDate(date.getDate() + 1);
	}
	resetTime(date);
};

const isDayOfMonthMatched = (fields: CronFields, date: Date) => fields.dayOfMonth.has(date.getDate()) && isRestricted(fields, 'dayOfMonth');

const isDayOfWeekMatched = (fields: CronFields, date: Date) => fields.dayOfWeek.has(date.getDay()) && isRestricted(fields, 'dayOfWeek');

const getNextDateFrom = (fields: CronFields, start: Date): Date => {
	let date = new Date(start);
	const firstDate = start.getTime();

	if (start.getMilliseconds() > 0) {
		date.setMilliseconds(0);
		date.setSeconds(date.getSeconds() + 1);
	}

	const timeout = Date.now() + SEARCH_TIMEOUT_MS;

	while (true) {
		const diff = date.getTime() - start.getTime();
		const prevMonth = date.getMonth();
		const prevDay = date.getDay();
		let origDate = new Date(date);

		if (Date.now() > timeout) {
			throw new Error(`Could not find the next run date for the cron expression within ${SEARCH_TIMEOUT_MS}ms`);
		}

		if (!fields.month.has(date.getMonth()) && isRestricted(fields, 'month')) {
			addMonthClamped(date);
			if (date.getMonth() === prevMonth) {
				addMonthClamped(date);
			}
			date.setDate(1);
			resetTime(date);
			continue;
		}

		if (!fields.dayOfMonth.has(date.getDate()) && isRestricted(fields, 'dayOfMonth') && !isDayOfWeekMatched(fields, date)) {
			advanceToNextDay(date, prevDay);
			continue;
		}

		if (!fields.dayOfWeek.has(date.getDay()) && isRestricted(fields, 'dayOfWeek') && !isDayOfMonthMatched(fields, date)) {
			advanceToNextDay(date, prevDay);
			if (date <= origDate) {
				date = findDST(origDate);
			}
			continue;
		}

		if (!fields.hour.has(date.getHours()) && isRestricted(fields, 'hour')) {
			origDate = new Date(date);
			const curHour = date.getHours();
			date.setHours(date.getHours() === 23 && diff > ONE_DAY_MS ? 0 : date.getHours() + 1);
			if (curHour === date.getHours()) {
				date.setHours(date.getHours() + 2);
			}
			date.setMinutes(0);
			date.setSeconds(0);
			if (date <= origDate) {
				date = findDST(origDate);
			}
			continue;
		}

		if (!fields.minute.has(date.getMinutes()) && isRestricted(fields, 'minute')) {
			origDate = new Date(date);
			date.setMinutes(date.getMinutes() === 59 && diff > ONE_HOUR_MS ? 0 : date.getMinutes() + 1);
			date.setSeconds(0);
			if (date <= origDate) {
				date = findDST(origDate);
			}
			continue;
		}

		if (!fields.second.has(date.getSeconds()) && isRestricted(fields, 'second')) {
			origDate = new Date(date);
			date.setSeconds(date.getSeconds() === 59 && diff > ONE_MINUTE_MS ? 0 : date.getSeconds() + 1);
			if (date <= origDate) {
				date = findDST(origDate);
			}
			continue;
		}

		if (date.getTime() === firstDate) {
			date.setSeconds(date.getSeconds() + 1);
			continue;
		}

		break;
	}

	return date;
};

/**
 * Returns the next time, after `from`, that a cron expression (5 or 6 fields) fires, in the local timezone.
 * Throws when the expression cannot be parsed.
 */
export const getNextCronRunDate = (expression: string, from: Date = new Date()): Date => getNextDateFrom(parseExpression(expression), from);
