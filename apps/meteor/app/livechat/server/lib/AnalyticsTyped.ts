import mem from 'mem';

import { Analytics } from './Analytics';

export const getAgentOverviewDataCached = mem(Analytics.getAgentOverviewData, { maxAge: 60000, cacheKey: JSON.stringify });
export const getAnalyticsOverviewDataCached = mem(Analytics.getAnalyticsOverviewData, { maxAge: 60000, cacheKey: JSON.stringify });
