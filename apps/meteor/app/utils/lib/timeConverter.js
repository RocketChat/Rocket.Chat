/**
 * return readable time format from seconds
 * @param  {Double} sec seconds
 * @return {String}     Readable string format
 */
export const secondsToHHMMSS = (sec) => {
	sec = parseFloat(sec);

	let hours = Math.floor(sec / 3600);
	let minutes = Math.floor((sec - hours * 3600) / 60);
	let seconds = Math.round(sec - hours * 3600 - minutes * 60);

	if (hours < 10) {
		hours = `0${hours}`;
	}
	if (minutes < 10) {
		minutes = `0${minutes}`;
	}
	if (seconds < 10) {
		seconds = `0${seconds}`;
	}

	if (hours > 0) {
		return `${hours}:${minutes}:${seconds}`;
	}
	if (minutes > 0) {
		return `00:${minutes}:${seconds}`;
	}
	return `00:00:${seconds}`;
};
