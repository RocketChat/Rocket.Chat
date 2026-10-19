export const DEFAULT_INTERVAL_HOURS = 1;

export const DEFAULT_WINDOW_DAYS = 2;
const MIN_WINDOW_DAYS = 1;
const MAX_WINDOW_DAYS = 7;

export const getCalendarSyncIntervalHours = (configured: number | undefined): number => {
	const hours = Math.trunc(configured ?? 0);

	for (let step = Math.min(hours > 0 ? hours : DEFAULT_INTERVAL_HOURS, 24); step > 1; step--) {
		if (24 % step === 0) {
			return step;
		}
	}

	return 1;
};

export const getCalendarSyncWindowDays = (configured: number | undefined): number => {
	const days = Math.trunc(configured ?? 0) || DEFAULT_WINDOW_DAYS;

	return Math.min(Math.max(days, MIN_WINDOW_DAYS), MAX_WINDOW_DAYS);
};
