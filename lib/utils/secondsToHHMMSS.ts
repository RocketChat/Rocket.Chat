/**
 * return readable time format from seconds
 * @param  sec seconds
 * @return Readable string format
 */
export const secondsToHHMMSS = (sec: number | string): string => {
	sec = parseFloat(String(sec));

	const hours = Math.floor(sec / 3600);
	const minutes = Math.floor((sec - (hours * 3600)) / 60);
	const seconds = Math.round(sec - (hours * 3600) - (minutes * 60));

	return [
		hours.toString(10).padStart(2, '0'),
		minutes.toString(10).padStart(2, '0'),
		seconds.toString(10).padStart(2, '0'),
	].join(':');
};
