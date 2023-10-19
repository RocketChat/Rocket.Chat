export const MINUTES = 1000 * 60;

export const getDifference = (now, ts, scale = MINUTES) => {
	const diff = now - ts / scale;
	return diff;
};
