export const MILLISECONDS = 1;
export const SECONDS = 1000;
export const MINUTES = 1000 * 60;
export const HOURS = 1000 * 60 * 60;
export const DAYS = 1000 * 60 * 60 * 24;

export const getDifference = (now, ts, scale = MILLISECONDS) => {
	const diff = now - ts / scale;
	return diff;
};
