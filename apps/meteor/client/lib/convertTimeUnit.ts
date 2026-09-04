export enum TIMEUNIT {
	days = 'days',
	hours = 'hours',
	minutes = 'minutes',
}

export const normalizeTimespan = (timespan: number | string): number => Number(timespan);

export const isValidTimespan = (timespan: number | string): boolean => {
	const value = normalizeTimespan(timespan);

	if (Number.isNaN(value)) {
		return false;
	}

	if (!Number.isFinite(value)) {
		return false;
	}

	if (value < 0) {
		return false;
	}

	return true;
};

export const timeUnitToMs = (unit: TIMEUNIT, timespan: number | string) => {
	const value = normalizeTimespan(timespan);

	if (!isValidTimespan(value)) {
		throw new Error(`timeUnitToMs - invalid timespan:${timespan}`);
	}

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
	const value = normalizeTimespan(timespan);

	if (!isValidTimespan(value)) {
		throw new Error(`msToTimeUnit - invalid timespan:${timespan}`);
	}

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
