/** Formats a number of seconds as `m:ss` (e.g. 86 → "1:26"). */
export const formatPlaybackTime = (seconds: number): string => {
	const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
	const minutes = Math.floor(total / 60);
	return `${minutes}:${String(total % 60).padStart(2, '0')}`;
};
