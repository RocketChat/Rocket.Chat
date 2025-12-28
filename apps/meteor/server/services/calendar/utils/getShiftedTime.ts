export function getShiftedTime(time: Date, minutes: number): Date {
	const newTime = new Date(time.valueOf());
	newTime.setMinutes(newTime.getMinutes() + minutes);
	return newTime;
}
