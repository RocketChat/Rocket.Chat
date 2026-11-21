export enum TIMEUNIT {
	days = 'days',
	hours = 'hours',
	minutes = 'minutes',
}

export const isValidTimespan = (timespan: unknown): boolean => {
	if (typeof timespan !== 'number' && typeof timespan !== 'string') {
		return false;
	}

	if (typeof timespan === 'string' && timespan.trim() === '') {
		return false;
	}

	const value = Number(timespan);
	return Number.isFinite(value) && value >= 0;
};

export const timeUnitToMs = (unit: TIMEUNIT, timespan: number | string) => {
	if (!isValidTimespan(timespan)) {
		throw new Error(`timeUnitToMs - invalid timespan:${timespan}`);
	}

	const value = Number(timespan);

	switch (unit) {
		case TIMEUNIT.days:
			return value * 24 * 60 * 60 * 1000;

		case TIMEUNIT.hours:
			return value * 60 * 60 * 1000;

		case TIMEUNIT.minutes:
			return value * 60 * 1000;

		default:
			throw new Error('timeUnitToMs - invalid time unit');
	}
};

export const msToTimeUnit = (unit: TIMEUNIT, timespan: number | string) => {
	if (!isValidTimespan(timespan)) {
		throw new Error(`msToTimeUnit - invalid timespan:${timespan}`);
	}

	const value = Number(timespan);

	switch (unit) {
		case TIMEUNIT.days:
			return value / 24 / 60 / 60 / 1000;
		case TIMEUNIT.hours:
			return value / 60 / 60 / 1000;
		case TIMEUNIT.minutes:
			return value / 60 / 1000;
		default:
			throw new Error('msToTimeUnit - invalid time unit');
	}
};
