// you must use jest.useFakeTimers for this to work.
export const setDate = (minutes = 1, hours = 0, date = 1) => {
	// June 12, 2024, 12:00 AM
	const fakeDate = new Date();
	fakeDate.setFullYear(2024);
	fakeDate.setMonth(5);
	fakeDate.setDate(date);
	fakeDate.setHours(hours);
	fakeDate.setMinutes(minutes);
	fakeDate.setSeconds(0);
	jest.setSystemTime(fakeDate);
};
