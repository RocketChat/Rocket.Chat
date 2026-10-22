export const MIN_LEAD_MS = 60 * 1000;
export const MAX_LEAD_MS = 120 * 24 * 60 * 60 * 1000;
export const MAX_ITEMS_PER_USER = 100;

export const isScheduledAtInRange = (scheduledAt: Date, now: Date): boolean => {
	const lead = scheduledAt.getTime() - now.getTime();
	return lead >= MIN_LEAD_MS && lead <= MAX_LEAD_MS;
};
