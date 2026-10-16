/**
 * Midnight of the day someone at `utcOffset` is living in. Without an offset there is nothing to go on but
 * the day the running process is in, which is the one day nobody asked about.
 */
export const startOfDayAt = (date: Date, utcOffset?: number): Date => {
	if (utcOffset === undefined) {
		const processDay = new Date(date);
		processDay.setHours(0, 0, 0, 0);

		return processDay;
	}

	const offsetMs = utcOffset * 3600000;

	const shifted = new Date(date.getTime() + offsetMs);
	shifted.setUTCHours(0, 0, 0, 0);

	return new Date(shifted.getTime() - offsetMs);
};
