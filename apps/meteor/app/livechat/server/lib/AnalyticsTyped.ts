import { OmnichannelAnalytics } from '@rocket.chat/core-services';
import mem from 'mem';

export const getAgentOverviewDataCached = mem(OmnichannelAnalytics.getAgentOverviewData, { maxAge: 60000, cacheKey: JSON.stringify });
// Agent overview data on realtime is cached for 5 seconds
// while the data on the overview page is cached for 1 minute
export const getAnalyticsOverviewDataCached = mem(OmnichannelAnalytics.getAnalyticsOverviewData, {
	maxAge: 60000,
	cacheKey: JSON.stringify,
});
export const getAnalyticsOverviewDataCachedForRealtime = mem(OmnichannelAnalytics.getAnalyticsOverviewData, {
	maxAge: process.env.TEST_MODE === 'true' ? 1 : 5000,
	cacheKey: JSON.stringify,
});
