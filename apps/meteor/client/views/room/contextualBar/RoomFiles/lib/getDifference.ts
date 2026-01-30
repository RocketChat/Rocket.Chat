export const MINUTES = 1000 * 60;

export const getDifference = (now: Date, ts: Date, scale = MINUTES) => {
	const diff = now.getTime() - ts.getTime() / scale;
	return diff;
};
