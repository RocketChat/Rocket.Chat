export const addMinutesToADate = (date: Date, minutes: number): Date => {
	const minutesInMs = minutes * 60 * 1000;
	return new Date(date.getTime() + minutesInMs);
};
