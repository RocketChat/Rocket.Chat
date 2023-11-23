import mem from 'mem';

import { Analytics } from './Analytics';

export const getAgentOverviewDataCached = mem(Analytics.getAgentOverviewData, { maxAge: 60000, cacheKey: JSON.stringify });
// Agent overview data on realtime is cached for 5 seconds
// while the data on the overview page is cached for 1 minute
export const getAnalyticsOverviewDataCached = mem(Analytics.getAnalyticsOverviewData, { maxAge: 60000, cacheKey: JSON.stringify });
export const getAnalyticsOverviewDataCachedForRealtime = mem(Analytics.getAnalyticsOverviewData, {
	maxAge: process.env.TEST_MODE === 'true' ? 1 : 5000,
	cacheKey: JSON.stringify,
});
