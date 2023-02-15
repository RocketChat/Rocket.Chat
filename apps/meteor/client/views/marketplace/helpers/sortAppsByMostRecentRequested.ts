export const sortAppsByMostOrLeastRecentRequested = (
	firstAppUnseenRequests: number | undefined,
	secondAppUnseenRequests: number | undefined,
) => (secondAppUnseenRequests || 0) - (firstAppUnseenRequests || 0);
