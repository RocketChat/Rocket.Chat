/**
 * @todo check alternatives for date/time formatting
 */
export const secondsToHHMMSS = (sec: number | string): string => {
	if (typeof sec !== 'number') {
		sec = parseFloat(sec);
	}

	const hours = Math.floor(sec / 3600);
	const minutes = Math.floor((sec - hours * 3600) / 60);
	const seconds = Math.round(sec - hours * 3600 - minutes * 60);

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
