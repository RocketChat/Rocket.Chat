export const convertFromDaysToMilliseconds = (days: number) => {
	if (typeof days !== 'number' || !Number.isInteger(days)) {
		throw new Error('days must be a number');
	}

	return days * 24 * 60 * 60 * 1000;
};
