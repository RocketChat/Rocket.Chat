export const addMinutesToADate = (date: Date, minutes: number): Date => {
	const copy = new Date(date);
	return new Date(copy.setMinutes(copy.getMinutes() + minutes));
};
