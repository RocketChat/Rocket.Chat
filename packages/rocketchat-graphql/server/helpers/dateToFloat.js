export function dateToFloat(date) {
	if (date) {
		return new Date(date).getTime();
	}
}
