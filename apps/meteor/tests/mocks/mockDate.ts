// you must use jest.useFakeTimers for this to work.
export const setDate = (minutes = 1, hours = 0, date = 1) => {
	// June 1, 2024, 12:00 AM
	const fakeDate = new Date();
	fakeDate.setFullYear(2024);
	fakeDate.setDate(date);
	fakeDate.setHours(hours);
	fakeDate.setMinutes(minutes);
	fakeDate.setSeconds(0);
	// month has to come after day, because june doesn't have a 31st day so it skips to july depending on the day the CI runs
	fakeDate.setMonth(5);
	jest.setSystemTime(fakeDate);
};
