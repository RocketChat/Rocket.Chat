/** Formats seconds as `m:ss`, or `h:mm:ss` past an hour; unknown durations read `-:--`. */
export const formatMediaTime = (seconds: number) => {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return '-:--';
	}
	const total = Math.floor(seconds);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const secs = String(total % 60).padStart(2, '0');
	return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
};
