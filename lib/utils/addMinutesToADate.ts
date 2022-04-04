export const addMinutesToADate = (date: Date, minutes: number): Date => {
	const copy = new Date(date);
	copy.setMinutes(copy.getMinutes() + minutes);
	return copy;
};
