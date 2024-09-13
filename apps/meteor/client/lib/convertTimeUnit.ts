export enum TIMEUNIT {
	days = 'days',
	hours = 'hours',
	minutes = 'minutes',
}

export const isValidTimespan = (timespan: number): boolean => {
	if (Number.isNaN(timespan)) {
		return false;
	}

	if (!Number.isFinite(timespan)) {
		return false;
	}

	if (timespan < 0) {
		return false;
	}

	return true;
};

export const timeUnitToMs = (unit: TIMEUNIT, timespan: number) => {
	if (!isValidTimespan(timespan)) {
		throw new Error(`timeUnitToMs - invalid timespan:${timespan}`);
	}

	switch (unit) {
		case TIMEUNIT.days:
			return timespan * 24 * 60 * 60 * 1000;

		case TIMEUNIT.hours:
			return timespan * 60 * 60 * 1000;

		case TIMEUNIT.minutes:
			return timespan * 60 * 1000;

		default:
			throw new Error('timeUnitToMs - invalid time unit');
	}
};

export const msToTimeUnit = (unit: TIMEUNIT, timespan: number) => {
	if (!isValidTimespan(timespan)) {
		throw new Error(`msToTimeUnit - invalid timespan:${timespan}`);
	}

	switch (unit) {
		case TIMEUNIT.days:
			return timespan / 24 / 60 / 60 / 1000;
		case TIMEUNIT.hours:
			return timespan / 60 / 60 / 1000;
		case TIMEUNIT.minutes:
			return timespan / 60 / 1000;
		default:
			throw new Error('msToTimeUnit - invalid time unit');
	}
};
