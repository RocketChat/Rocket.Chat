import { Users } from '@rocket.chat/models';
import { isLivechatAnalyticsAgentOverviewProps, isLivechatAnalyticsOverviewProps } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { settings } from '../../../../settings/server';
import { getAgentOverviewDataCached, getAnalyticsOverviewDataCached } from '../../lib/AnalyticsTyped';

API.v1.addRoute(
	'livechat/analytics/agent-overview',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsAgentOverviewProps,
	},
	{
		async get() {
			const { name, departmentId, from, to } = this.queryParams;

			if (!name) {
				throw new Error('invalid-chart-name');
			}

			const user = await Users.findOneById(this.userId, { projection: { _id: 1, utcOffset: 1 } });
			return API.v1.success(
				await getAgentOverviewDataCached({
					departmentId,
					utcOffset: user?.utcOffset || 0,
					daterange: { from, to },
					chartOptions: { name },
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/overview',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsOverviewProps,
	},
	{
		async get() {
			const { name, departmentId, from, to } = this.queryParams;

			if (!name) {
				throw new Error('invalid-chart-name');
			}

			const user = await Users.findOneById(this.userId, { projection: { _id: 1, utcOffset: 1 } });
			const language = user?.language || settings.get('Language') || 'en';

			return API.v1.success(
				await getAnalyticsOverviewDataCached({
					departmentId,
					utcOffset: user?.utcOffset || 0,
					daterange: { from, to },
					analyticsOptions: { name },
					language,
				}),
			);
		},
	},
);
