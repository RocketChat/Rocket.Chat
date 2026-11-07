/**
 * @todo check alternatives for date/time formatting
 */
export const secondsToHHMMSS = (sec: number | string): string => {
	if (typeof sec !== 'number') {
		sec = parseFloat(sec);
	}

	const totalSeconds = Math.round(sec);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
	const seconds = totalSeconds - hours * 3600 - minutes * 60;

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
