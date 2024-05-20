export enum TIMEUNIT {
	days = 'days',
	hours = 'hours',
	minutes = 'minutes',
}

export const timeUnitToMs = (unit: TIMEUNIT, timespan: number) => {
	switch (unit) {
		case TIMEUNIT.days:
			return timespan * 24 * 60 * 60 * 1000;

		case TIMEUNIT.hours:
			return timespan * 60 * 60 * 1000;

		case TIMEUNIT.minutes:
			return timespan * 60 * 1000;

		default:
			throw new Error('TimespanSettingInput - timeUnitToMs - invalid time unit');
	}
};

export const msToTimeUnit = (unit: TIMEUNIT, timespan: number) => {
	switch (unit) {
		case TIMEUNIT.days:
			return timespan / 24 / 60 / 60 / 1000;
		case TIMEUNIT.hours:
			return timespan / 60 / 60 / 1000;
		case TIMEUNIT.minutes:
			return timespan / 60 / 1000;
		default:
			throw new Error('TimespanSettingInput - msToTimeUnit - invalid time unit');
	}
};
