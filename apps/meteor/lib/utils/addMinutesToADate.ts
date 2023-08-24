export const addMinutesToADate = (date: Date, minutes: number): Date => {
	return new Date(date.getTime() + minutes * 60 * 1000);
};
